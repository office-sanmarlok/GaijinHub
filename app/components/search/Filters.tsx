'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Button } from '@/app/components/ui/button';
import { Search } from 'lucide-react';

const categories = [
  { id: 'Housing', name: 'Housing' },
  { id: 'Jobs', name: 'Jobs' },
  { id: 'Items for Sale', name: 'Items for Sale' },
  { id: 'Services', name: 'Services' },
] as const;

interface FiltersProps {
  onFilterChange: (filters: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
  initialValues?: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}

export default function Filters({ onFilterChange, initialValues }: FiltersProps) {
  const [searchQuery, setSearchQuery] = useState(initialValues?.q || '');
  const [category, setCategory] = useState(initialValues?.category);
  const [minPrice, setMinPrice] = useState(initialValues?.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialValues?.maxPrice?.toString() || '');

  useEffect(() => {
    if (initialValues) {
      setSearchQuery(initialValues.q || '');
      setCategory(initialValues.category);
      setMinPrice(initialValues.minPrice?.toString() || '');
      setMaxPrice(initialValues.maxPrice?.toString() || '');
    }
  }, [initialValues]);

  const handleApplyFilters = () => {
    onFilterChange({
      q: searchQuery || undefined,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    });
  };

  const handleReset = () => {
    setSearchQuery('');
    setCategory(undefined);
    setMinPrice('');
    setMaxPrice('');
    onFilterChange({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>フィルター</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>キーワード検索</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="キーワードを入力"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>カテゴリー</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="カテゴリーを選択" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>価格帯</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="下限"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span>-</span>
            <Input
              type="number"
              placeholder="上限"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleApplyFilters}>適用</Button>
          <Button variant="outline" onClick={handleReset}>
            リセット
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 