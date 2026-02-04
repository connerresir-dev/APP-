import type { GameType } from '@/types';
import { GAMES, GAME_RULES } from '@/data/games';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { BookOpen, SlidersHorizontal, Check } from 'lucide-react';

interface RulesModalProps {
  gameType: GameType;
  isOpen: boolean;
  onClose: () => void;
  customRules: Record<string, boolean>;
  onCustomRuleChange: (ruleId: string, value: boolean) => void;
  readOnly?: boolean;
}

export function RulesModal({ 
  gameType, 
  isOpen, 
  onClose, 
  customRules, 
  onCustomRuleChange,
  readOnly = false 
}: RulesModalProps) {
  const game = GAMES[gameType];
  const rules = GAME_RULES[gameType];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{game.icon}</span>
            <div>
              <DialogTitle className="text-xl">{game.name}</DialogTitle>
              <p className="text-sm text-slate-500">{game.maxPlayers} Spieler max.</p>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="rules" className="flex-1">
          <TabsList className="mx-6">
            <TabsTrigger value="rules" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Regeln
            </TabsTrigger>
            {!readOnly && (
              <TabsTrigger value="settings" className="gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Einstellungen
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="rules" className="mt-0">
            <ScrollArea className="h-[50vh]">
              <div className="p-6 pt-2 space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-2">Spielziel</h4>
                  <p className="text-slate-600 text-sm">{game.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3">Spielablauf</h4>
                  <ol className="space-y-2">
                    {rules.basicRules.map((rule, index) => (
                      <li 
                        key={index} 
                        className="flex gap-3 text-sm text-slate-600"
                      >
                        <span className={cn(
                          "flex-shrink-0 w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center",
                          "bg-gradient-to-br text-white",
                          game.color
                        )}>
                          {index + 1}
                        </span>
                        <span className="pt-0.5">{rule}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {!readOnly && (
            <TabsContent value="settings" className="mt-0">
              <ScrollArea className="h-[50vh]">
                <div className="p-6 pt-2 space-y-4">
                  <p className="text-sm text-slate-500">
                    Passe die Spielregeln nach deinen Vorlieben an.
                  </p>

                  <div className="space-y-4">
                    {rules.customRules.map((rule) => (
                      <div 
                        key={rule.id}
                        className="flex items-start justify-between gap-4 p-3 rounded-lg bg-slate-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label 
                              htmlFor={rule.id}
                              className="font-medium text-slate-800 cursor-pointer"
                            >
                              {rule.name}
                            </Label>
                            {customRules[rule.id] && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {rule.description}
                          </p>
                        </div>
                        <Switch
                          id={rule.id}
                          checked={customRules[rule.id] ?? rule.defaultValue}
                          onCheckedChange={(checked) => onCustomRuleChange(rule.id, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
