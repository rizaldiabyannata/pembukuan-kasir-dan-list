"use client";

import * as React from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { CardSkeleton } from "@/components/ui/card-skeleton";
import { ChartSkeleton } from "@/components/ui/chart-skeleton";
import { FadeInContent } from "@/components/ui/fade-in-content";
import { StaggeredList } from "@/components/ui/staggered-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * AnimationDemo - Demonstration component for loading state animations
 * Shows all animation features working together
 */
export function AnimationDemo() {
  const [isTableLoading, setIsTableLoading] = React.useState(true);
  const [isCardsLoading, setIsCardsLoading] = React.useState(true);
  const [isChartLoading, setIsChartLoading] = React.useState(true);
  const [isButtonLoading, setIsButtonLoading] = React.useState(false);
  const [showOverlay, setShowOverlay] = React.useState(false);

  // Simulate data loading
  React.useEffect(() => {
    const timer1 = setTimeout(() => setIsTableLoading(false), 2000);
    const timer2 = setTimeout(() => setIsCardsLoading(false), 2500);
    const timer3 = setTimeout(() => setIsChartLoading(false), 3000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const handleButtonClick = () => {
    setIsButtonLoading(true);
    setTimeout(() => setIsButtonLoading(false), 2000);
  };

  const handleOverlayDemo = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 2000);
  };

  const mockTableData = [
    { id: 1, name: "Item 1", status: "Active" },
    { id: 2, name: "Item 2", status: "Pending" },
    { id: 3, name: "Item 3", status: "Active" },
  ];

  const mockCards = [
    { id: 1, title: "Card 1", description: "Description 1" },
    { id: 2, title: "Card 2", description: "Description 2" },
    { id: 3, title: "Card 3", description: "Description 3" },
  ];

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Animation Demo</h1>
        <p className="text-muted-foreground">
          Demonstrating smooth transitions and animations for loading states
        </p>
      </div>

      {/* Button Animations */}
      <Card>
        <CardHeader>
          <CardTitle>Button Animations (200ms transitions)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <LoadingButton
              isLoading={isButtonLoading}
              loadingText="Menyimpan..."
              onClick={handleButtonClick}
            >
              Simpan Data
            </LoadingButton>
            <Button onClick={handleButtonClick} variant="outline">
              Trigger Loading
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overlay Animation */}
      <Card className="relative">
        <LoadingOverlay isVisible={showOverlay} message="Memproses data..." />
        <CardHeader>
          <CardTitle>Overlay Animation (150ms fade-out)</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOverlayDemo}>Show Overlay</Button>
        </CardContent>
      </Card>

      {/* Table Skeleton with Staggered Animation */}
      <Card>
        <CardHeader>
          <CardTitle>
            Table Skeleton (200ms fade-in, 50ms stagger per row)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isTableLoading ? (
            <TableSkeleton rows={5} columns={4} />
          ) : (
            <FadeInContent isLoading={false}>
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-4 text-left">ID</th>
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTableData.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-4">{item.id}</td>
                        <td className="p-4">{item.name}</td>
                        <td className="p-4">{item.status}</td>
                        <td className="p-4">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </FadeInContent>
          )}
          <Button
            onClick={() => setIsTableLoading(true)}
            className="mt-4"
            variant="outline"
            size="sm"
          >
            Reload Table
          </Button>
        </CardContent>
      </Card>

      {/* Card Skeleton with Staggered Animation */}
      <Card>
        <CardHeader>
          <CardTitle>
            Card Skeleton (200ms fade-in, 50ms stagger per card)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isCardsLoading ? (
            <CardSkeleton count={3} />
          ) : (
            <StaggeredList className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockCards.map((card) => (
                <Card key={card.id}>
                  <CardHeader>
                    <CardTitle>{card.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </StaggeredList>
          )}
          <Button
            onClick={() => setIsCardsLoading(true)}
            className="mt-4"
            variant="outline"
            size="sm"
          >
            Reload Cards
          </Button>
        </CardContent>
      </Card>

      {/* Chart Skeleton */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Chart Skeleton (200ms fade-in)
        </h2>
        {isChartLoading ? (
          <ChartSkeleton showStats={true} />
        ) : (
          <Card className="animate-in fade-in duration-200">
            <CardHeader>
              <CardTitle>Sample Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Chart Content Here</p>
              </div>
            </CardContent>
          </Card>
        )}
        <Button
          onClick={() => setIsChartLoading(true)}
          className="mt-4"
          variant="outline"
          size="sm"
        >
          Reload Chart
        </Button>
      </div>

      {/* Animation Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Animation Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>✓ Content fade-in: 200ms</li>
            <li>✓ Overlay fade-out: 150ms</li>
            <li>✓ Button state transitions: 200ms</li>
            <li>✓ Staggered item delay: 50ms per item</li>
            <li>✓ Layout stability: Max 5px shift</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
