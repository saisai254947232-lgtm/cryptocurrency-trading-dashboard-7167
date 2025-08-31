import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";

const fetchBitcoinPrices = async () => {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30&interval=daily"
  );
  const data = await response.json();
  
  // Format data for the chart - take last 30 days
  return data.prices.slice(-30).map(([timestamp, price]: [number, number]) => ({
    date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: Math.round(price)
  }));
};

const CryptoChart = () => {
  const { data: priceData, isLoading } = useQuery({
    queryKey: ['bitcoinChart'],
    queryFn: fetchBitcoinPrices,
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Bitcoin Price Chart</h2>
        </div>
        <div className="h-[400px] w-full flex items-center justify-center">
          <span className="text-muted-foreground">Loading chart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 rounded-lg mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Bitcoin Price Chart (30 Days)</h2>
      </div>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={priceData}>
            <XAxis 
              dataKey="date" 
              stroke="#475569"
              fontSize={12}
            />
            <YAxis 
              stroke="#475569"
              fontSize={12}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip 
              contentStyle={{ 
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#0F172A' }}
              itemStyle={{ color: '#6366F1' }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
            />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#6366F1" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6366F1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CryptoChart;