import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number;
  gradient?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, gradient }) => {
  return (
    <Card
      className="text-white shadow-lg hover:-translate-y-1 transition-all duration-300 border-0 cursor-default"
      style={{ background: gradient || 'linear-gradient(135deg, #0ea5e9 0%, #22d3ee 100%)' }}
    >
      <CardContent className="p-6">
        <h3 className="text-sm font-medium opacity-90 mb-2">{title}</h3>
        <div className="text-4xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
