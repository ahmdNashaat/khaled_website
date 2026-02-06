import Layout from '@/components/layout/Layout';

const PrivacyPolicyPage = () => {
  return (
    <Layout>
      <section className="bg-muted/30 py-16">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">سياسة الخصوصية</h1>
          <p className="text-muted-foreground max-w-2xl">
            تحتوي هذه الصفحة على معلومات مؤقتة حول الخصوصية.
            سنقوم بتحديثها بالتفاصيل الرسمية قريباً.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container max-w-3xl">
          <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">المعلومات التي نجمعها</h2>
              <p className="text-muted-foreground">
                نجمع بيانات الاتصال ومعلومات الطلبات وبيانات الاستخدام الأساسية لتشغيل الخدمة.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">كيف نستخدم المعلومات</h2>
              <p className="text-muted-foreground">
                تُستخدم البيانات لإتمام الطلبات وتقديم الدعم وتحسين تجربة التسوق.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">المشاركة</h2>
              <p className="text-muted-foreground">
                نشارك فقط البيانات الضرورية مع مزودي خدمات التوصيل والدفع لإتمام طلبك.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">الأمان</h2>
              <p className="text-muted-foreground">
                نستخدم إجراءات أمان قياسية لحماية معلوماتك.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">حقوقك</h2>
              <p className="text-muted-foreground">
                يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها عن طريق الاتصال بالدعم.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PrivacyPolicyPage;