import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PerformanceAlert } from '@/lib/qualityScore';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PerformanceAlertsProps {
  alerts: PerformanceAlert[];
}

export function PerformanceAlerts({ alerts }: PerformanceAlertsProps) {
  const [isOpen, setIsOpen] = useState(true);
  
  if (alerts.length === 0) {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <Info className="w-5 h-5" />
          <p className="font-medium">No critical alerts - all ISOs performing within acceptable ranges</p>
        </div>
      </Card>
    );
  }
  
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const infoCount = alerts.filter(a => a.severity === 'info').length;
  
  const getIcon = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };
  
  const getBgColor = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };
  
  const getTextColor = (severity: PerformanceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-900';
      case 'warning':
        return 'text-amber-900';
      case 'info':
        return 'text-blue-900';
    }
  };
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-gradient-to-r from-red-50 to-amber-50 border-red-200">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">Performance Alerts</h3>
                <div className="flex gap-3 mt-1">
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {criticalCount} Critical
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge className="bg-amber-600 text-xs">
                      {warningCount} Warning{warningCount !== 1 ? 's' : ''}
                    </Badge>
                  )}
                  {infoCount > 0 && (
                    <Badge className="bg-blue-600 text-xs">
                      {infoCount} Info
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-2">
            {alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border ${getBgColor(alert.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getIcon(alert.severity)}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm mb-1">
                          <Badge variant="secondary" className="mr-2">{alert.iso}</Badge>
                          {alert.message}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {alert.metric}: <span className={`font-medium ${getTextColor(alert.severity)}`}>
                            {alert.value}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
