interface Window {
  gtag: (
    command: 'config' | 'js' | 'event',
    targetId: string,
    config?: {
      transport_url?: string;
      first_party_collection?: boolean;
      [key: string]: any;
    }
  ) => void;
  dataLayer: any[];
}
