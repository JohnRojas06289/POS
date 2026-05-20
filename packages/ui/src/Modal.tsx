import { Modal as RNModal, View, Text, Pressable, StyleSheet, Platform } from 'react-native';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType={Platform.OS === 'web' ? 'fade' : 'slide'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {title ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </Pressable>
            </View>
          ) : null}
          {children}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: Platform.OS === 'web' ? 12 : 20,
    borderTopRightRadius: Platform.OS === 'web' ? 12 : 20,
    borderBottomLeftRadius: Platform.OS === 'web' ? 12 : 0,
    borderBottomRightRadius: Platform.OS === 'web' ? 12 : 0,
    padding: 24,
    paddingBottom: 32,
    minWidth: Platform.OS === 'web' ? 400 : undefined,
    maxWidth: Platform.OS === 'web' ? 560 : undefined,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#111' },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 16, color: '#6b7280' },
});
