import { Shield, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import cryptovaultLogo from "@/assets/cryptovault-logo.png";
import Signup from "../pages/Signup";

export const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-vault-bg border-b border-vault-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img src={cryptovaultLogo} alt="CryptoVault" className="h-8 w-8 rounded-lg" />
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-gradient-crypto bg-clip-text text-transparent">
                CryptoVault
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link 
              to="/vault" 
              className={`text-foreground hover:text-primary transition-smooth ${location.pathname === '/vault' ? 'text-primary' : ''}`}
            >
              Vault
            </Link>
            <Link 
              to="/share" 
              className={`text-foreground hover:text-primary transition-smooth ${location.pathname === '/share' ? 'text-primary' : ''}`}
            >
              Share
            </Link>
            <Link 
              to="/audit" 
              className={`text-foreground hover:text-primary transition-smooth ${location.pathname === '/audit' ? 'text-primary' : ''}`}
            >
              Audit
            </Link>
            <Link 
              to="/download" 
              className={`text-foreground hover:text-primary transition-smooth ${location.pathname === '/download' ? 'text-primary' : ''}`}
            >
              Download
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button variant="default" size="sm" className="bg-gradient-crypto" asChild>
              <Link to="/Signup">Get Started</Link>
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Header;