import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

interface InvoiceLine {
  id: number;
  quantity: number;
  description: string;
  unitPrice: number;
  lineExtensionAmount: number;
  taxRate: number;
  taxAmount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  issueTime: string;
  supplier: {
    nit: string;
    name: string;
    address: string;
    city: string;
    country: string;
  };
  customer: {
    documentType: string;
    documentNumber: string;
    name: string;
  } | null;
  lines: InvoiceLine[];
  subtotal: number;
  taxTotal: number;
  total: number;
  softwareKey: string;
}

@Injectable()
export class XmlGeneratorService {
  generateInvoiceXml(data: InvoiceData): string {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ProfileID>DIAN 2.1</cbc:ProfileID>
  <cbc:ID>${data.invoiceNumber}</cbc:ID>
  <cbc:UUID schemeName="CUFE-SHA384">${this.calculateCufe(data)}</cbc:UUID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode listID="GTF-GRETI">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID schemeID="31">${data.supplier.nit}</cbc:CompanyID>
        <cbc:TaxLevelCode listName="48">R-99-PN</cbc:TaxLevelCode>
        <cac:TaxScheme>
          <cbc:ID>ZZ</cbc:ID>
          <cbc:Name>No aplica</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXml(data.supplier.name)}</cbc:RegistrationName>
        <cbc:CompanyID schemeID="31">${data.supplier.nit}</cbc:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID schemeID="${data.customer ? '13' : '31'}">${data.customer?.documentNumber ?? '222222222222'}</cbc:CompanyID>
        <cbc:TaxLevelCode listName="48">R-99-PN</cbc:TaxLevelCode>
        <cac:TaxScheme>
          <cbc:ID>ZZ</cbc:ID>
          <cbc:Name>No aplica</cbc:Name>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXml(data.customer?.name ?? 'Consumidor Final')}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="COP">${data.taxTotal.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="COP">${data.subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="COP">${data.taxTotal.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:Percent>19.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>01</cbc:ID>
          <cbc:Name>IVA</cbc:Name>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="COP">${data.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="COP">${data.subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="COP">${data.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="COP">${data.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${data.lines
  .map(
    (line, i) => `  <cac:InvoiceLine>
    <cbc:ID>${i + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="94">${line.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="COP">${line.lineExtensionAmount.toFixed(2)}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="COP">${line.taxAmount.toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description>${this.escapeXml(line.description)}</cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="COP">${line.unitPrice.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`,
  )
  .join('\n')}
</Invoice>`;

    return xml;
  }

  calculateCufe(data: InvoiceData): string {
    // CUFE = SHA384(NumFac+FecFac+HorFac+ValFac+CodImp1+ValImp1+CodImp2+ValImp2+CodImp3+ValImp3+ValTot+NitOFE+NumAdq+ClaveSOFT)
    const valIva = data.taxTotal.toFixed(2);
    const str = [
      data.invoiceNumber,
      data.issueDate,
      data.issueTime,
      data.subtotal.toFixed(2),
      '01', valIva, // IVA
      '04', '0.00', // INC
      '03', '0.00', // ICA
      data.total.toFixed(2),
      data.supplier.nit,
      '222222222222', // consumidor final default
      data.softwareKey,
    ].join('');

    return createHash('sha384').update(str, 'utf8').digest('hex');
  }

  generateCreditNoteXml(data: {
    creditNoteNumber: string;
    originalCufe: string;
    issueDate: string;
    issueTime: string;
    supplier: InvoiceData['supplier'];
    lines: InvoiceLine[];
    total: number;
    reason?: string;
    softwareKey: string;
  }): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<CreditNote xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:UBLVersionID>UBL 2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>10</cbc:CustomizationID>
  <cbc:ID>${data.creditNoteNumber}</cbc:ID>
  <cbc:IssueDate>${data.issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${data.issueTime}</cbc:IssueTime>
  <cbc:DocumentCurrencyCode>COP</cbc:DocumentCurrencyCode>
  <cbc:DiscrepancyResponse>
    <cbc:ReferenceID>${data.originalCufe}</cbc:ReferenceID>
    <cbc:ResponseCode>1</cbc:ResponseCode>
    <cbc:Description>${this.escapeXml(data.reason ?? 'Devolución')}</cbc:Description>
  </cbc:DiscrepancyResponse>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="COP">${data.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</CreditNote>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
