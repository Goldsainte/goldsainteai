import { Mail, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ContactCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  email: string;
  responseTime?: string;
  details: string[];
}

export function ContactCard({ icon, title, description, email, responseTime, details }: ContactCardProps) {
  const { toast } = useToast();

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(email);
    toast({
      title: "Email copied",
      description: `${email} copied to clipboard`,
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl mb-1">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <a 
              href={`mailto:${email}`}
              className="text-primary hover:underline font-medium"
            >
              {email}
            </a>
          </div>
          {responseTime && (
            <p className="text-xs text-muted-foreground ml-6">
              {responseTime}
            </p>
          )}
        </div>

        <ul className="space-y-1 text-sm text-muted-foreground">
          {details.map((detail, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>

        <div className="flex gap-2 pt-2">
          <Button 
            asChild
            size="sm"
            className="flex-1"
          >
            <a href={`mailto:${email}`}>
              <Mail className="h-4 w-4" />
              Send Email
            </a>
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={handleCopyEmail}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
