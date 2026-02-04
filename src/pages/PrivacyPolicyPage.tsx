import Layout from '@/components/layout/Layout';

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <section className="bg-muted/30 py-16">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground max-w-2xl">
            This page contains temporary placeholder information about privacy.
            We will update it with official details soon.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container max-w-3xl">
          <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
              <p className="text-muted-foreground">
                We collect contact details, order information, and basic usage data to operate the service.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">How We Use Information</h2>
              <p className="text-muted-foreground">
                Data is used to fulfill orders, provide support, and improve the shopping experience.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Sharing</h2>
              <p className="text-muted-foreground">
                We only share necessary data with delivery and payment providers to complete your order.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Security</h2>
              <p className="text-muted-foreground">
                We use standard security measures to protect your information.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Your Rights</h2>
              <p className="text-muted-foreground">
                You can request access, correction, or deletion of your data by contacting support.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPolicyPage;
