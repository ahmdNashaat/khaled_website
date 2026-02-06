import Layout from '@/components/layout/Layout';

const DeliveryInformationPage = () => {
  return (
    <Layout>
      <section className="bg-muted/30 py-16">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">معلومات التوصيل</h1>
          <p className="text-muted-foreground max-w-2xl">
            تحتوي هذه الصفحة على معلومات مؤقتة حول خدمة التوصيل.
            سنقوم بتحديثها بالتفاصيل الرسمية قريباً.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-3">مناطق التوصيل</h2>
              <p className="text-muted-foreground">
                نقوم حالياً بالتوصيل داخل المدن المدعومة والمناطق المجاورة.
                سيتم تأكيد التغطية الدقيقة أثناء الدفع.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-3">الوقت المتوقع</h2>
              <p className="text-muted-foreground">
                يستغرق التوصيل القياسي من 1-3 أيام عمل حسب الموقع وحجم الطلبات.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-3">الرسوم</h2>
              <p className="text-muted-foreground">
                يتم حساب رسوم التوصيل عند الدفع وقد يتم خصمها للطلبات الكبيرة.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-md">
              <h2 className="text-xl font-semibold mb-3">تتبع الطلب</h2>
              <p className="text-muted-foreground">
                يمكنك تتبع حالة طلبك من حسابك تحت قسم طلباتي.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default DeliveryInformationPage;