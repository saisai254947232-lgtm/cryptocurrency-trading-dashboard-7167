import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, ArrowDownIcon } from 'lucide-react';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  price_change_24h: number;
  market_cap: number;
  volume_24h: number;
  is_custom: boolean;
}

const Market = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoins();
  }, []);

  const fetchCoins = async () => {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('*')
        .eq('is_active', true)
        .order('market_cap', { ascending: false });

      if (error) throw error;
      setCoins(data || []);
    } catch (error) {
      console.error('Error fetching coins:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Market Overview</h1>
          <p className="text-muted-foreground">
            Real-time cryptocurrency market data and prices
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cryptocurrency Prices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Coin
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      Price
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      24h Change
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      Market Cap
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      Volume (24h)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin) => (
                    <tr key={coin.id} className="border-b border-border hover:bg-accent/50">
                      <td className="py-4 px-2">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-primary">
                              {coin.symbol.slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium flex items-center space-x-2">
                              <span>{coin.symbol}</span>
                              {coin.is_custom && (
                                <Badge variant="secondary" className="text-xs">
                                  Custom
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {coin.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right font-mono">
                        {formatPrice(coin.price)}
                      </td>
                      <td className="py-4 px-2 text-right">
                        <div
                          className={`flex items-center justify-end space-x-1 ${
                            coin.price_change_24h >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {coin.price_change_24h >= 0 ? (
                            <ArrowUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4" />
                          )}
                          <span className="font-medium">
                            {Math.abs(coin.price_change_24h).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-2 text-right font-mono">
                        {formatMarketCap(coin.market_cap)}
                      </td>
                      <td className="py-4 px-2 text-right font-mono">
                        {formatMarketCap(coin.volume_24h)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Market;