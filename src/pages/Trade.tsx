import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CryptoChart from '@/components/CryptoChart';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  price: number;
}

const Trade = () => {
  const { user } = useAuth();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [selectedPair, setSelectedPair] = useState<string>('BTC/USDT');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCoins();
  }, []);

  const fetchCoins = async () => {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('id, symbol, name, price')
        .eq('is_active', true);

      if (error) throw error;
      setCoins(data || []);
    } catch (error) {
      console.error('Error fetching coins:', error);
    }
  };

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!amount || (orderType === 'limit' && !price)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const [baseCoin, quoteCoin] = selectedPair.split('/');
      const baseId = coins.find(c => c.symbol === baseCoin)?.id;
      const quoteId = coins.find(c => c.symbol === quoteCoin)?.id;

      if (!baseId || !quoteId) {
        throw new Error('Invalid trading pair');
      }

      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          base_coin_id: baseId,
          quote_coin_id: quoteId,
          type: orderType,
          side,
          amount: parseFloat(amount),
          price: orderType === 'limit' ? parseFloat(price) : null,
        });

      if (error) throw error;

      toast.success(`${side.charAt(0).toUpperCase() + side.slice(1)} order placed successfully!`);
      setAmount('');
      setPrice('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const tradingPairs = [
    'BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'XRP/USDT', 'MOON/USDT'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Spot Trading</h1>
          <p className="text-muted-foreground">
            Trade cryptocurrencies with market and limit orders
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Trading Pair Selection */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Trading Pair</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedPair} onValueChange={setSelectedPair}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingPairs.map((pair) => (
                      <SelectItem key={pair} value={pair}>
                        {pair}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>

          {/* Price Chart */}
          <div className="lg:col-span-3">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle>{selectedPair} Price Chart</CardTitle>
              </CardHeader>
              <CardContent className="h-[520px]">
                <CryptoChart />
              </CardContent>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Place Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Order Type</Label>
                  <Select value={orderType} onValueChange={(value: 'market' | 'limit') => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderType === 'limit' && (
                  <div>
                    <Label htmlFor="price">Price (USDT)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      step="0.00000001"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="amount">Amount ({selectedPair.split('/')[0]})</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.00000001"
                  />
                </div>

                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="text-green-600 data-[state=active]:bg-green-100">
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="text-red-600 data-[state=active]:bg-red-100">
                      Sell
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="buy" className="mt-4">
                    <Button
                      onClick={() => handleTrade('buy')}
                      disabled={loading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {loading ? 'Placing Order...' : `Buy ${selectedPair.split('/')[0]}`}
                    </Button>
                  </TabsContent>
                  <TabsContent value="sell" className="mt-4">
                    <Button
                      onClick={() => handleTrade('sell')}
                      disabled={loading}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {loading ? 'Placing Order...' : `Sell ${selectedPair.split('/')[0]}`}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>Available Balance:</span>
                    <span>0.00 USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Trading Fee:</span>
                    <span>0.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Trade;