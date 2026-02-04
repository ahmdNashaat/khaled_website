import Layout from '@/components/layout/Layout';

const TermsPage = () => {
  return (
    <Layout>
      <section className="bg-muted/30 py-16">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms and Conditions</h1>
          <p className="text-muted-foreground max-w-2xl">
            This page contains temporary placeholder information about our terms.
            We will update it with official details soon.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container max-w-3xl">
          <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Account Use</h2>
              <p className="text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Orders and Pricing</h2>
              <p className="text-muted-foreground">
                Prices and availability may change without notice. Orders are confirmed once processed.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Product Availability</h2>
              <p className="text-muted-foreground">
                We strive for accuracy, but inventory may be limited. We will contact you if an item is unavailable.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Limitation of Liability</h2>
              <p className="text-muted-foreground">
                Our liability is limited to the value of the order in accordance with applicable laws.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TermsPage;
