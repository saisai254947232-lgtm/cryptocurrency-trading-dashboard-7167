import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Wallet, Download, Upload, Clock } from 'lucide-react';

interface Balance {
  id: string;
  balance: number;
  locked_balance: number;
  coin: {
    id: string;
    symbol: string;
    name: string;
    price: number;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  wallet_address?: string;
  created_at: string;
  coin: {
    symbol: string;
    name: string;
  };
}

const Assets = () => {
  const { user } = useAuth();
  const [balances, setBalances] = useState<Balance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  const walletAddresses = {
    BTC: '1LyZHu2xzqYyzLesS7UYecXUTW6AGngBFR',
    ETH: '0x1016a1ff1907e77afa6f4889f8796b4c3237252d',
    'USDT (ERC20)': '0x1016a1ff1907e77afa6f4889f8796b4c3237252d',
    'USDT (TRC20)': 'TBdEXqVLqdrdD2mtPGysRQRQj53PEMsT1o',
  };

  useEffect(() => {
    if (user) {
      fetchBalances();
      fetchTransactions();
    }
  }, [user]);

  const fetchBalances = async () => {
    try {
      const { data, error } = await supabase
        .from('user_balances')
        .select(`
          id,
          balance,
          locked_balance,
          coin:coins(id, symbol, name, price)
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setBalances(data || []);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          type,
          amount,
          status,
          wallet_address,
          created_at,
          coin:coins(symbol, name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (coinSymbol: string) => {
    if (!depositAmount) {
      toast.error('Please enter deposit amount');
      return;
    }

    try {
      const { data: coinData } = await supabase
        .from('coins')
        .select('id')
        .eq('symbol', coinSymbol)
        .single();

      if (!coinData) throw new Error('Coin not found');

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          coin_id: coinData.id,
          type: 'deposit',
          amount: parseFloat(depositAmount),
          status: 'pending',
          wallet_address: walletAddresses[coinSymbol as keyof typeof walletAddresses],
        });

      if (error) throw error;

      toast.success('Deposit request submitted! Please wait for admin approval.');
      setDepositAmount('');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit deposit request');
    }
  };

  const handleWithdraw = async (coinSymbol: string) => {
    if (!withdrawAmount || !withdrawAddress) {
      toast.error('Please enter withdrawal amount and address');
      return;
    }

    try {
      const { data: coinData } = await supabase
        .from('coins')
        .select('id')
        .eq('symbol', coinSymbol)
        .single();

      if (!coinData) throw new Error('Coin not found');

      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          coin_id: coinData.id,
          type: 'withdrawal',
          amount: parseFloat(withdrawAmount),
          status: 'pending',
          wallet_address: withdrawAddress,
        });

      if (error) throw error;

      toast.success('Withdrawal request submitted! Please wait for admin approval.');
      setWithdrawAmount('');
      setWithdrawAddress('');
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit withdrawal request');
    }
  };

  const totalValue = balances.reduce((sum, balance) => {
    return sum + (balance.balance * balance.coin.price);
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'pending': 'outline',
      'completed': 'default',
      'cancelled': 'secondary',
      'rejected': 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
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
          <h1 className="text-3xl font-bold mb-2">Assets</h1>
          <p className="text-muted-foreground">
            Manage your cryptocurrency portfolio and transactions
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Assets</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{balances.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transactions.filter(t => t.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Balances */}
          <Card>
            <CardHeader>
              <CardTitle>Your Balances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {balances.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No balances found. Make a deposit to get started.
                  </p>
                ) : (
                  balances.map((balance) => (
                    <div
                      key={balance.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {balance.coin.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{balance.coin.symbol}</div>
                          <div className="text-sm text-muted-foreground">
                            {balance.coin.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {balance.balance.toFixed(8)} {balance.coin.symbol}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(balance.balance * balance.coin.price)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Deposit/Withdraw */}
          <Card>
            <CardHeader>
              <CardTitle>Deposit & Withdraw</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="deposit">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="deposit">
                    <Download className="h-4 w-4 mr-2" />
                    Deposit
                  </TabsTrigger>
                  <TabsTrigger value="withdraw">
                    <Upload className="h-4 w-4 mr-2" />
                    Withdraw
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="deposit" className="space-y-4 mt-4">
                  <div>
                    <Label>Deposit Addresses</Label>
                    <div className="space-y-2 mt-2">
                      {Object.entries(walletAddresses).map(([coin, address]) => (
                        <div key={coin} className="p-3 bg-muted rounded-lg">
                          <div className="font-medium text-sm">{coin}</div>
                          <div className="text-xs text-muted-foreground font-mono break-all">
                            {address}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="depositAmount">Amount</Label>
                    <Input
                      id="depositAmount"
                      type="number"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleDeposit('BTC')} className="text-xs">
                      Deposit BTC
                    </Button>
                    <Button onClick={() => handleDeposit('ETH')} className="text-xs">
                      Deposit ETH
                    </Button>
                    <Button onClick={() => handleDeposit('USDT')} className="text-xs">
                      Deposit USDT
                    </Button>
                    <Button onClick={() => handleDeposit('MOON')} className="text-xs">
                      Deposit MOON
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="withdraw" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="withdrawAddress">Withdrawal Address</Label>
                    <Input
                      id="withdrawAddress"
                      placeholder="Enter wallet address"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="withdrawAmount">Amount</Label>
                    <Input
                      id="withdrawAmount"
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleWithdraw('BTC')} variant="outline" className="text-xs">
                      Withdraw BTC
                    </Button>
                    <Button onClick={() => handleWithdraw('ETH')} variant="outline" className="text-xs">
                      Withdraw ETH
                    </Button>
                    <Button onClick={() => handleWithdraw('USDT')} variant="outline" className="text-xs">
                      Withdraw USDT
                    </Button>
                    <Button onClick={() => handleWithdraw('MOON')} variant="outline" className="text-xs">
                      Withdraw MOON
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Coin
                    </th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-border hover:bg-accent/50">
                        <td className="py-4 px-2 capitalize">{transaction.type}</td>
                        <td className="py-4 px-2">{transaction.coin.symbol}</td>
                        <td className="py-4 px-2 text-right font-mono">
                          {transaction.amount.toFixed(8)}
                        </td>
                        <td className="py-4 px-2 text-center">
                          {getStatusBadge(transaction.status)}
                        </td>
                        <td className="py-4 px-2">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assets;