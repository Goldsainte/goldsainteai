import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SimpleHeader } from "@/components/SimpleHeader";
import { GroupPaymentSetup } from "@/components/GroupPaymentSetup";
import { GroupPaymentStatus } from "@/components/GroupPaymentStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

export default function TestGroupPayment() {
  const navigate = useNavigate();
  const [testJobId, setTestJobId] = useState("");
  const [testAmount, setTestAmount] = useState("1000");
  const [activeTab, setActiveTab] = useState("setup");

  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={() => navigate(-1)}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Test Group Payment System</h1>
            <p className="text-muted-foreground mt-2">
              Test the split payment functionality for group bookings
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Setup Test Parameters</CardTitle>
              <CardDescription>
                Configure the test scenario (you'll need a real job ID from your marketplace)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jobId">Job ID</Label>
                <Input
                  id="jobId"
                  value={testJobId}
                  onChange={(e) => setTestJobId(e.target.value)}
                  placeholder="Enter a marketplace job ID"
                />
                <p className="text-xs text-muted-foreground">
                  Get this from a marketplace job you created with an accepted bid
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Test Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={testAmount}
                  onChange={(e) => setTestAmount(e.target.value)}
                  placeholder="1000"
                />
              </div>
            </CardContent>
          </Card>

          {testJobId && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="setup">Payment Setup</TabsTrigger>
                <TabsTrigger value="status">Payment Status</TabsTrigger>
              </TabsList>

              <TabsContent value="setup" className="mt-6">
                <GroupPaymentSetup
                  jobId={testJobId}
                  totalAmount={parseFloat(testAmount)}
                  currency="USD"
                  onComplete={() => {
                    setActiveTab("status");
                  }}
                />
              </TabsContent>

              <TabsContent value="status" className="mt-6">
                <GroupPaymentStatus jobId={testJobId} />
              </TabsContent>
            </Tabs>
          )}

          {!testJobId && (
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground space-y-4">
                  <p className="text-lg font-medium">How to Test:</p>
                  <ol className="text-left max-w-md mx-auto space-y-3">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                      <span>Go to Marketplace and create a job</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                      <span>Have an agent submit a bid (or create one yourself)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">3</span>
                      <span>Accept the bid</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">4</span>
                      <span>Copy the job ID and paste it above</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">5</span>
                      <span>Add traveler emails (use real emails you can access)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">6</span>
                      <span>Send payment links and check your emails!</span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="text-yellow-800 dark:text-yellow-200">Testing Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-yellow-800 dark:text-yellow-200">
              <p>• Use real email addresses you can access to receive payment links</p>
              <p>• Stripe payment links will be in TEST MODE - use test card: 4242 4242 4242 4242</p>
              <p>• Any expiry date in the future and any 3-digit CVC works</p>
              <p>• Payment status updates in real-time - no need to refresh!</p>
              <p>• Try both "split equally" and "one person pays" modes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
