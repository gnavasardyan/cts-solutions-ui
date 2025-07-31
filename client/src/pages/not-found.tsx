import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6 text-center">
          <div className="mb-4">
            <i className="fas fa-exclamation-triangle text-4xl text-industrial-orange mb-4"></i>
            <h1 className="text-2xl font-bold text-foreground">404</h1>
            <p className="text-lg text-muted-foreground">Страница не найдена</p>
          </div>

          <p className="mt-4 text-sm text-muted-foreground mb-6">
            Запрашиваемая страница не существует или была перемещена.
          </p>
          
          <Link href="/">
            <Button className="w-full bg-industrial-blue hover:bg-blue-700">
              <i className="fas fa-home"></i>
              <span>На главную</span>
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
