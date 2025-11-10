import { Header } from "@/components/Header";

const Audit = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            Blockchain <span className="bg-gradient-crypto bg-clip-text text-transparent">Audit Trail</span>
          </h1>
          <p className="text-muted-foreground">
            Immutable records of all file operations and transactions
          </p>
        </div>

        <div className="bg-vault-surface p-8 rounded-xl border border-vault-border">
          <p className="text-center text-muted-foreground">
            Audit trail interface coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default Audit;