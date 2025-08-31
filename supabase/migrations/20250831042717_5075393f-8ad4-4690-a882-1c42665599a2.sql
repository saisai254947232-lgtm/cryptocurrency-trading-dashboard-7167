-- Create coins table for supported cryptocurrencies
CREATE TABLE public.coins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  price DECIMAL(20, 8) DEFAULT 0,
  price_change_24h DECIMAL(10, 4) DEFAULT 0,
  market_cap BIGINT DEFAULT 0,
  volume_24h BIGINT DEFAULT 0,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_balances table for user wallet balances
CREATE TABLE public.user_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id UUID NOT NULL REFERENCES public.coins(id) ON DELETE CASCADE,
  balance DECIMAL(20, 8) DEFAULT 0,
  locked_balance DECIMAL(20, 8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, coin_id)
);

-- Create transactions table for all user transactions
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_id UUID NOT NULL REFERENCES public.coins(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'buy', 'sell')),
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),
  fee DECIMAL(20, 8) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled', 'rejected')),
  transaction_hash TEXT,
  wallet_address TEXT,
  admin_approved_by UUID REFERENCES auth.users(id),
  admin_approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table for trading orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  base_coin_id UUID NOT NULL REFERENCES public.coins(id) ON DELETE CASCADE,
  quote_coin_id UUID NOT NULL REFERENCES public.coins(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('market', 'limit')),
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8),
  filled_amount DECIMAL(20, 8) DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'filled', 'cancelled', 'partial')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for coins (readable by all, writable by admins only)
CREATE POLICY "Coins are viewable by everyone"
ON public.coins FOR SELECT
USING (true);

-- Create policies for user_balances
CREATE POLICY "Users can view their own balances"
ON public.user_balances FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own balances"
ON public.user_balances FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balances"
ON public.user_balances FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policies for transactions
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
ON public.transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policies for orders
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_coins_updated_at
BEFORE UPDATE ON public.coins
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_balances_updated_at
BEFORE UPDATE ON public.user_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default coins including custom MOON coin
INSERT INTO public.coins (symbol, name, is_custom, price, logo_url) VALUES
('BTC', 'Bitcoin', false, 43000, null),
('ETH', 'Ethereum', false, 2300, null),
('BNB', 'BNB', false, 220, null),
('XRP', 'XRP', false, 0.52, null),
('USDT', 'Tether', false, 1.00, null),
('MOON', 'Moon Token', true, 0.001, null);