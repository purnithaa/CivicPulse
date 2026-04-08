"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-foreground lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure system preferences and notification settings
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* General settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">General</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <Label htmlFor="city-name">City Name</Label>
              <Input id="city-name" defaultValue="Metro City" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input id="admin-email" defaultValue="admin@metrocity.gov" className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive email alerts for new critical issues</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Auto-Assignment</p>
                <p className="text-xs text-muted-foreground">Automatically route issues to departments</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Citizen Updates</p>
                <p className="text-xs text-muted-foreground">Send status updates to citizens automatically</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* SLA settings */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base font-semibold">SLA Thresholds</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="critical-sla">Critical (hours)</Label>
                <Input id="critical-sla" type="number" defaultValue="4" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="high-sla">High (hours)</Label>
                <Input id="high-sla" type="number" defaultValue="24" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="medium-sla">Medium (hours)</Label>
                <Input id="medium-sla" type="number" defaultValue="72" className="mt-2" />
              </div>
              <div>
                <Label htmlFor="low-sla">Low (hours)</Label>
                <Input id="low-sla" type="number" defaultValue="168" className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          className="self-end"
          onClick={() => toast.success("Settings saved successfully")}
        >
          Save Settings
        </Button>
      </div>
    </div>
  )
}
