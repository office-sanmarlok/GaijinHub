'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, X, Train } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/app/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/app/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

interface Line {
  id: string;
  name: string;
  company_name?: string;
}

interface MultiLineSelectorProps {
  selectedLineIds: string[];
  onSelectionChange: (lineIds: string[]) => void;
  prefectureId?: number;
  className?: string;
}

export function MultiLineSelector({
  selectedLineIds,
  onSelectionChange,
  prefectureId,
  className,
}: MultiLineSelectorProps) {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedLines, setSelectedLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(false);

  // Load lines when prefecture changes
  useEffect(() => {
    if (!prefectureId) {
      setLines([]);
      return;
    }

    const loadLines = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/location/lines?prefectureId=${prefectureId}`);
        const data = await response.json();
        setLines(data.lines || []);
      } catch (error) {
        console.error('路線の取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLines();
  }, [prefectureId]);

  // Update selected lines when line IDs change
  useEffect(() => {
    const newSelectedLines = lines.filter(line => selectedLineIds.includes(line.id));
    setSelectedLines(newSelectedLines);
  }, [selectedLineIds, lines]);

  const handleLineToggle = (line: Line) => {
    const isSelected = selectedLineIds.includes(line.id);
    let newSelectedIds;

    if (isSelected) {
      newSelectedIds = selectedLineIds.filter(id => id !== line.id);
    } else {
      newSelectedIds = [...selectedLineIds, line.id];
    }

    onSelectionChange(newSelectedIds);
  };

  const handleLineRemove = (lineId: string) => {
    const newSelectedIds = selectedLineIds.filter(id => id !== lineId);
    onSelectionChange(newSelectedIds);
  };

  const clearAllSelections = () => {
    onSelectionChange([]);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Train className="h-5 w-5" />
          路線選択（複数選択可）
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 路線選択ドロップダウン */}
        <div className="space-y-2">
          <label className="text-sm font-medium">路線を追加</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={loading || !prefectureId}
              >
                {loading ? "読み込み中..." : (prefectureId ? "路線を選択" : "都道府県を先に選択してください")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="路線を検索..." />
                <CommandEmpty>該当する路線がありません</CommandEmpty>
                <CommandGroup>
                  {lines.map((line) => (
                    <CommandItem
                      key={line.id}
                      value={line.name}
                      onSelect={() => {
                        handleLineToggle(line);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedLineIds.includes(line.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <Train className="mr-2 h-4 w-4" />
                      {line.name}
                      {line.company_name && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {line.company_name}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* 選択された路線の表示 */}
        {selectedLines.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">選択中の路線</label>
              <Button variant="outline" size="sm" onClick={clearAllSelections}>
                すべてクリア
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedLines.map((line) => (
                <Badge key={line.id} variant="secondary" className="flex items-center gap-1">
                  🚃 {line.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => handleLineRemove(line.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedLines.length}路線選択中
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 