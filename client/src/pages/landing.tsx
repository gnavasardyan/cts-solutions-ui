import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-industrial-blue bg-opacity-10 rounded-lg flex items-center justify-center">
                <i className="fas fa-industry text-industrial-blue text-2xl"></i>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Система прослеживаемости
            </h1>
            <p className="text-industrial-gray">
              Металлоконструкции
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Войдите в систему для доступа к панели управления прослеживаемостью металлоконструкций
            </p>
            
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full bg-industrial-blue hover:bg-blue-700 text-white font-medium h-12"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Войти в систему
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-industrial-gray">
              Система обеспечивает контроль перемещения изделий от завода-производителя до точки использования
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
