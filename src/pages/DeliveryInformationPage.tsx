import Layout from '@/components/layout/Layout';

const DeliveryInformationPage = () => {
  return (
    <Layout>
      <section className="bg-muted/30 py-16">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Delivery Information</h1>
          <p className="text-muted-foreground max-w-2xl">
            This page contains temporary placeholder information about our delivery service.
            We will update it with official details soon.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-3">Delivery Areas</h2>
              <p className="text-muted-foreground">
                We currently deliver within our supported cities and nearby areas.
                Exact coverage will be confirmed during checkout.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-3">Estimated Time</h2>
              <p className="text-muted-foreground">
                Standard delivery takes 1-3 business days depending on location and order volume.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-3">Fees</h2>
              <p className="text-muted-foreground">
                Delivery fees are calculated at checkout and may be discounted for large orders.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-3">Order Tracking</h2>
              <p className="text-muted-foreground">
                You can track your order status from your account under My Orders.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DeliveryInformationPage;
