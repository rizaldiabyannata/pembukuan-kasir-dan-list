"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Loader2, User, Car, Users } from "lucide-react";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { ErrorDisplay } from "@/components/ui/error-display";

export function IncentiveRecipientsWidget({
  period = "month",
  loading: externalLoading,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const authFetch = useAuthFetch();

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await authFetch(
        `/api/dashboard/incentive-recipients?period=${period}`
      );

      if (!res) {
        // Auth redirect happened
        return;
      }

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch incentive data");
      }

      const result = await res.json();
      setData(result.data);
    } catch (err) {
      console.error("Error fetching incentive recipients:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case "driver":
        return <User className="h-3 w-3" />;
      case "staff":
        return <Users className="h-3 w-3" />;
      case "armada":
        return <Car className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getEntityLabel = (type) => {
    switch (type) {
      case "driver":
        return "Sopir";
      case "staff":
        return "Staff";
      case "armada":
        return "Armada";
      default:
        return type;
    }
  };

  const isLoading = loading || externalLoading;

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Penerima Insentif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
                </div>
                <div className="h-6 bg-muted animate-pulse rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Penerima Insentif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorDisplay
            error={error}
            onRetry={fetchData}
            title="Gagal Memuat Data"
            description="Tidak dapat memuat data penerima insentif. Silakan coba lagi."
          />
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || !data.recipients || data.recipients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            Penerima Insentif
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Belum ada data insentif untuk periode ini</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main content
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-4 w-4 text-green-600" />
          Penerima Insentif
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recipients list */}
          <div className="space-y-3">
            {data.recipients.map((recipient, index) => (
              <div
                key={`${recipient.recipientName}-${index}`}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm mb-1">
                    {recipient.recipientName}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {recipient.incentiveCount} insentif
                    </span>
                    {recipient.relatedEntities &&
                      recipient.relatedEntities.length > 0 && (
                        <>
                          {recipient.relatedEntities.map((entity, idx) => (
                            <Badge
                              key={`${entity.type}-${entity.id}-${idx}`}
                              variant="secondary"
                              className="text-xs flex items-center gap-1"
                            >
                              {getEntityIcon(entity.type)}
                              <span>
                                {getEntityLabel(entity.type)}: {entity.name}
                              </span>
                            </Badge>
                          ))}
                        </>
                      )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-semibold text-sm text-green-600">
                    {formatCurrency(recipient.totalAmount)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary statistics */}
          {data.summary && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-primary">
                    {data.summary.totalRecipients}
                  </div>
                  <div className="text-xs text-muted-foreground">Penerima</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(data.summary.totalAmount)}
                  </div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-primary">
                    {data.summary.totalIncentives}
                  </div>
                  <div className="text-xs text-muted-foreground">Insentif</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
