import Layout from '@/components/layout/Layout';

const ReturnPolicyPage = () => {
  return (
    <Layout>
      <section className="bg-muted/30 py-16">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Return Policy</h1>
          <p className="text-muted-foreground max-w-2xl">
            This page contains temporary placeholder information about returns.
            We will update it with official details soon.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container max-w-3xl">
          <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Eligibility Window</h2>
              <p className="text-muted-foreground">
                Returns are accepted within 7-14 days of delivery, subject to product condition.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Condition Requirements</h2>
              <p className="text-muted-foreground">
                Items must be unused, unopened, and in original packaging with proof of purchase.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">How to Request a Return</h2>
              <p className="text-muted-foreground">
                Contact our support team with your order number and the reason for return.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Refunds</h2>
              <p className="text-muted-foreground">
                Approved refunds are processed to the original payment method within 5-10 business days.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ReturnPolicyPage;
