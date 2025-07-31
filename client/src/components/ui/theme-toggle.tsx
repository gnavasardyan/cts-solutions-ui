import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9"
    >
      <i className="fas fa-sun text-lg rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"></i>
      <i className="fas fa-moon absolute text-lg rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"></i>
      <span className="sr-only">Переключить тему</span>
    </Button>
  )
}