declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
  }

  type Listener = (state: NetInfoState) => void;

  const NetInfo: {
    addEventListener: (listener: Listener) => () => void;
  };

  export default NetInfo;
}
