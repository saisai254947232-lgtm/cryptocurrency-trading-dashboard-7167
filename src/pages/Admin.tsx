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
import { Settings, Users, Coins, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
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

interface UserProfile {
  user_id: string;
  username?: string;
  full_name?: string;
  created_at: string;
}

const Admin = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [moonPrice, setMoonPrice] = useState('');
  const [priceChange, setPriceChange] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
    fetchUsers();
    fetchMoonPrice();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          type,
          amount,
          status,
          wallet_address,
          created_at,
          coin:coins(symbol, name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // Note: This would need proper admin permissions in production
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          username,
          full_name,
          created_at
        `)
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoonPrice = async () => {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('price')
        .eq('symbol', 'MOON')
        .single();

      if (error) throw error;
      if (data) {
        setMoonPrice(data.price.toString());
      }
    } catch (error) {
      console.error('Error fetching MOON price:', error);
    }
  };

  const updateMoonPrice = async () => {
    if (!moonPrice) {
      toast.error('Please enter a price');
      return;
    }

    try {
      const { error } = await supabase
        .from('coins')
        .update({ price: parseFloat(moonPrice) })
        .eq('symbol', 'MOON');

      if (error) throw error;
      toast.success('MOON price updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update MOON price');
    }
  };

  const updateMoonPriceByPercentage = async () => {
    if (!priceChange) {
      toast.error('Please enter a percentage change');
      return;
    }

    try {
      const { data: currentPrice } = await supabase
        .from('coins')
        .select('price')
        .eq('symbol', 'MOON')
        .single();

      if (!currentPrice) throw new Error('Could not fetch current price');

      const changePercent = parseFloat(priceChange) / 100;
      const newPrice = currentPrice.price * (1 + changePercent);

      const { error } = await supabase
        .from('coins')
        .update({ price: newPrice })
        .eq('symbol', 'MOON');

      if (error) throw error;
      
      setMoonPrice(newPrice.toString());
      setPriceChange('');
      toast.success(`MOON price updated by ${priceChange}%!`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update MOON price');
    }
  };

  const approveTransaction = async (transactionId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          status: approve ? 'completed' : 'rejected',
          admin_approved_by: user?.id,
          admin_approved_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (error) throw error;
      
      toast.success(`Transaction ${approve ? 'approved' : 'rejected'} successfully!`);
      fetchTransactions();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update transaction');
    }
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
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage platform operations, users, and transactions
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MOON Price</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseFloat(moonPrice || '0').toFixed(6)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="transactions">Pending Transactions</TabsTrigger>
            <TabsTrigger value="moon">MOON Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Pending Transactions</CardTitle>
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
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                          Address
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                          Date
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-muted-foreground">
                            No pending transactions
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
                            <td className="py-4 px-2 font-mono text-sm">
                              {transaction.wallet_address?.slice(0, 16)}...
                            </td>
                            <td className="py-4 px-2 text-center">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="py-4 px-2">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-2 text-center">
                              <div className="flex justify-center space-x-2">
                                <Button
                                  onClick={() => approveTransaction(transaction.id, true)}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => approveTransaction(transaction.id, false)}
                                  size="sm"
                                  variant="destructive"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moon">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Set MOON Price</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="moonPrice">Price (USD)</Label>
                    <Input
                      id="moonPrice"
                      type="number"
                      step="0.00000001"
                      placeholder="0.001"
                      value={moonPrice}
                      onChange={(e) => setMoonPrice(e.target.value)}
                    />
                  </div>
                  <Button onClick={updateMoonPrice} className="w-full">
                    Update Price
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Adjust Price by Percentage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="priceChange">Percentage Change (%)</Label>
                    <Input
                      id="priceChange"
                      type="number"
                      placeholder="5 (for +5%) or -10 (for -10%)"
                      value={priceChange}
                      onChange={(e) => setPriceChange(e.target.value)}
                    />
                  </div>
                  <Button onClick={updateMoonPriceByPercentage} className="w-full">
                    Apply Percentage Change
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                          Username
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                          Full Name
                        </th>
                        <th className="text-left py-3 px-2 font-medium text-muted-foreground">
                          Join Date
                        </th>
                        <th className="text-center py-3 px-2 font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-muted-foreground">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.user_id} className="border-b border-border hover:bg-accent/50">
                            <td className="py-4 px-2">{user.username || 'Not set'}</td>
                            <td className="py-4 px-2">{user.full_name || 'Not set'}</td>
                            <td className="py-4 px-2">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-2 text-center">
                              <div className="flex justify-center space-x-2">
                                <Button size="sm" variant="outline">
                                  View
                                </Button>
                                <Button size="sm" variant="outline">
                                  Lock/Unlock
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;