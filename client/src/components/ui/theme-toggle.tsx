import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="h-9 w-9 min-w-[48px] min-h-[48px]"
      title="Переключить тему"
    >
      {theme === "light" ? (
        <i className="fas fa-moon text-lg"></i>
      ) : (
        <i className="fas fa-sun text-lg"></i>
      )}
    </Button>
  )
}