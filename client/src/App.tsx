import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Dashboard from "@/pages/dashboard";
import Applications from "@/pages/applications";
import GardenLayout from "@/pages/garden-layout";
import WorkDays from "@/pages/work-days";
import Messages from "@/pages/messages";
import Forum from "@/pages/forum";
import Payments from "@/pages/payments";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import ApplicationForm from "@/pages/application-form";
import GardenerPayments from "@/pages/gardener-payments";

function Router() {
  return (
    <Switch>
      {/* Auth pages */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Main pages */}
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/applications" component={Applications} />
      <Route path="/application-form" component={ApplicationForm} />
      <Route path="/garden-layout" component={GardenLayout} />
      <Route path="/work-days" component={WorkDays} />
      <Route path="/messages" component={Messages} />
      <Route path="/forum" component={Forum} />
      <Route path="/payments" component={Payments} />
      <Route path="/settings" component={Settings} />
       <Route path="/gardener-payments" component={GardenerPayments} />

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Layout>
        <Router />
      </Layout>
    </TooltipProvider>
  );
}

export default App;
