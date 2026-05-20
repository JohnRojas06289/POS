import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, Modal,
  ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { v4 as uuidv4 } from 'uuid';
import { getProducts, LocalProduct, saveOfflineOrder } from '../../src/database/local.db';
import { useOfflinePOS } from '../../src/hooks/useOfflinePOS';
import { formatCOP } from '../../src/utils/currency';

interface CartItem {
  variantId: string;
  variantName: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export default function POSScreen() {
  const [products, setProducts] = useState<LocalProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const { submitOrder, isSyncing } = useOfflinePOS();

  useEffect(() => {
    getProducts().then((p) => { setProducts(p); setLoading(false); });
  }, []);

  const addToCart = useCallback(async (product: LocalProduct, variantIdx: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const variant = product.variants[variantIdx];
    setCart((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.variantId === variant.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          variantName: variant.name,
          productName: product.name,
          unitPrice: variant.price,
          quantity: 1,
        },
      ];
    });
  }, []);

  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const handleCheckout = async (method: string) => {
    const localId = uuidv4();
    await submitOrder({
      localId,
      items: cart.map((i) => ({ variantId: i.variantId, quantity: i.quantity, unitPrice: i.unitPrice })),
      payments: [{ method, amount: total }],
    });
    setCart([]);
    setShowPayment(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.row}>
        {/* Product catalog */}
        <FlatList
          style={styles.catalog}
          data={products}
          keyExtractor={(p) => p.id}
          numColumns={2}
          renderItem={({ item: product }) => (
            <Pressable
              style={styles.productCard}
              onPress={() => void addToCart(product, 0)}
            >
              <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
              <Text style={styles.productPrice}>
                {formatCOP(product.variants[0]?.price ?? 0)}
              </Text>
              <Text style={styles.productStock}>
                Stock: {product.variants[0]?.stock ?? 0}
              </Text>
            </Pressable>
          )}
        />

        {/* Cart */}
        <View style={styles.cart}>
          <Text style={styles.cartTitle}>Carrito ({cart.length})</Text>
          <ScrollView style={{ flex: 1 }}>
            {cart.map((item) => (
              <View key={item.variantId} style={styles.cartItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartItemName} numberOfLines={1}>{item.productName}</Text>
                  <Text style={styles.cartItemVariant}>{item.variantName}</Text>
                </View>
                <View style={styles.cartItemRight}>
                  <Text style={styles.cartItemQty}>×{item.quantity}</Text>
                  <Text style={styles.cartItemPrice}>
                    {formatCOP(item.unitPrice * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCOP(total)}</Text>
          </View>
          <Pressable
            style={[styles.checkoutBtn, cart.length === 0 && styles.checkoutBtnDisabled]}
            onPress={() => setShowPayment(true)}
            disabled={cart.length === 0}
          >
            <Text style={styles.checkoutBtnText}>
              {isSyncing ? 'Sincronizando...' : 'Cobrar'}
            </Text>
          </Pressable>
          <Pressable onPress={() => setCart([])} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Limpiar</Text>
          </Pressable>
        </View>
      </View>

      {/* Payment Modal */}
      <Modal visible={showPayment} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Pago</Text>
            <Text style={styles.modalTotal}>{formatCOP(total)}</Text>
            {['cash', 'card', 'transfer', 'mixed'].map((method) => (
              <Pressable
                key={method}
                style={styles.paymentBtn}
                onPress={() => void handleCheckout(method)}
              >
                <Text style={styles.paymentBtnText}>
                  {{ cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', mixed: 'Mixto' }[method]}
                </Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setShowPayment(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f9fafb' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flex: 1, flexDirection: 'row' },
  catalog: { flex: 1.2, padding: 8 },
  productCard: {
    flex: 1, margin: 4, backgroundColor: '#fff', borderRadius: 10, padding: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  productName: { fontSize: 13, fontWeight: '600', color: '#111', marginBottom: 4 },
  productPrice: { fontSize: 15, fontWeight: '700', color: '#2563eb' },
  productStock: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  cart: { width: 220, backgroundColor: '#fff', borderLeftWidth: 1, borderColor: '#e5e7eb', padding: 12, flexDirection: 'column' },
  cartTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 8 },
  cartItem: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#f3f4f6' },
  cartItemName: { fontSize: 13, fontWeight: '500', color: '#111' },
  cartItemVariant: { fontSize: 11, color: '#9ca3af' },
  cartItemRight: { alignItems: 'flex-end' },
  cartItemQty: { fontSize: 12, color: '#6b7280' },
  cartItemPrice: { fontSize: 13, fontWeight: '600', color: '#111' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 2, borderColor: '#e5e7eb', marginTop: 8 },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#374151' },
  totalValue: { fontSize: 17, fontWeight: '800', color: '#111' },
  checkoutBtn: { backgroundColor: '#16a34a', borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 8 },
  checkoutBtnDisabled: { opacity: 0.4 },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  clearBtn: { marginTop: 8, alignItems: 'center', padding: 8 },
  clearBtnText: { color: '#ef4444', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4, color: '#111' },
  modalTotal: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 20 },
  paymentBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 10 },
  paymentBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { color: '#6b7280', fontSize: 15 },
});
