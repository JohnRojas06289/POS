import { Test, TestingModule } from '@nestjs/testing';
import { DianService } from './dian.service';
import { XmlGeneratorService } from './xml-generator.service';
import { PrismaService } from '../../database/prisma/prisma.service';
import { createHash } from 'crypto';

const makeMockPrisma = () => ({
  order: { findUnique: jest.fn() },
  tenant: { findUnique: jest.fn() },
  tenantConfig: { findUnique: jest.fn() },
  dianDocument: { create: jest.fn(), findFirst: jest.fn() },
  orderItem: { findMany: jest.fn() },
  payment: { findMany: jest.fn() },
});

describe('DianService', () => {
  let dianService: DianService;
  let xmlGenerator: XmlGeneratorService;
  let mockPrisma: ReturnType<typeof makeMockPrisma>;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DianService,
        XmlGeneratorService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    dianService = module.get<DianService>(DianService);
    xmlGenerator = module.get<XmlGeneratorService>(XmlGeneratorService);
  });

  describe('XmlGeneratorService — CUFE', () => {
    it('calculates CUFE using SHA-384 with correct concatenation', () => {
      const data = {
        invoiceNumber: 'SETP00000001',
        issueDate: '2026-05-20',
        issueTime: '10:00:00-05:00',
        supplier: { nit: '900123456', name: 'Demo Store', address: '', city: '', country: 'CO' },
        customer: null,
        lines: [],
        subtotal: 100000,
        taxTotal: 19000,
        total: 119000,
        softwareKey: 'TEST_SOFTWARE_KEY_12345678901234',
      };

      const cufe = xmlGenerator.calculateCufe(data);

      // Verify it's a 96-char hex string (SHA-384 = 48 bytes = 96 hex chars)
      expect(cufe).toHaveLength(96);
      expect(cufe).toMatch(/^[0-9a-f]{96}$/);

      // Verify the concatenation
      const expected = createHash('sha384')
        .update(
          'SETP00000001' +
          '2026-05-20' +
          '10:00:00-05:00' +
          '100000.00' +
          '01' + '19000.00' +
          '04' + '0.00' +
          '03' + '0.00' +
          '119000.00' +
          '900123456' +
          '222222222222' +
          'TEST_SOFTWARE_KEY_12345678901234',
          'utf8',
        )
        .digest('hex');

      expect(cufe).toBe(expected);
    });

    it('XML contains all required DIAN UBL 2.1 mandatory fields', () => {
      const data = {
        invoiceNumber: 'SETP00000001',
        issueDate: '2026-05-20',
        issueTime: '10:00:00-05:00',
        supplier: { nit: '900123456', name: 'Demo Store', address: '', city: '', country: 'CO' },
        customer: null,
        lines: [
          {
            id: 1,
            quantity: 2,
            description: 'Camiseta talla M',
            unitPrice: 50000,
            lineExtensionAmount: 100000,
            taxRate: 0.19,
            taxAmount: 19000,
          },
        ],
        subtotal: 100000,
        taxTotal: 19000,
        total: 119000,
        softwareKey: 'TEST_SOFTWARE_KEY_12345678901234',
      };

      const xml = xmlGenerator.generateInvoiceXml(data);

      expect(xml).toContain('UBL 2.1');
      expect(xml).toContain('SETP00000001');
      expect(xml).toContain('2026-05-20');
      expect(xml).toContain('InvoiceTypeCode');
      expect(xml).toContain('01'); // venta
      expect(xml).toContain('AccountingSupplierParty');
      expect(xml).toContain('AccountingCustomerParty');
      expect(xml).toContain('TaxTotal');
      expect(xml).toContain('LegalMonetaryTotal');
      expect(xml).toContain('InvoiceLine');
      expect(xml).toContain('COP');
      expect(xml).toContain('900123456');
      expect(xml).toContain('119000.00');
      expect(xml).toContain('CUFE-SHA384');
    });

    it('nota crédito referencia el CUFE de la factura original', async () => {
      mockPrisma.dianDocument.findFirst.mockResolvedValue({
        id: 'doc-1',
        cufe: 'abc123def456' + '0'.repeat(84), // 96 chars total
        documentType: 'invoice',
      });

      mockPrisma.dianDocument.create.mockResolvedValue({
        id: 'cn-1',
        documentType: 'credit_note',
        status: 'generated',
      });

      const result = await dianService.generateCreditNote('order-1', 'refund-1', 'Devolución cliente');

      expect(result.originalCufe).toContain('abc123');
      expect(mockPrisma.dianDocument.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderId: 'order-1', documentType: 'invoice' },
        }),
      );
    });
  });
});
