import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h1>Shielded ZEC orgs</h1>
      <p className="muted">
        Create funds for family, business, investment clubs, and community treasuries.
        Governance on zk-CosmWasm; money in Ironwood via NozyWallet.
      </p>
      <div className="card">
        <h2>Get started</h2>
        <p>
          Connect NozyWallet and create a fund, or open an existing fund by slug.
        </p>
        <p style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link href="/create" className="btn">
            Create fund
          </Link>
        </p>
      </div>
      <div className="card">
        <h3>Open fund</h3>
        <p className="muted">
          Visit <code>/f/your-slug</code> after creating a fund.
        </p>
      </div>
    </div>
  );
}
