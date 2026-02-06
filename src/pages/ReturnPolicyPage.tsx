import Layout from '@/components/layout/Layout';

const ReturnPolicyPage = () => {
  return (
    <Layout>
      <section className="bg-muted/30 py-16">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">سياسة الإرجاع</h1>
          <p className="text-muted-foreground max-w-2xl">
            تحتوي هذه الصفحة على معلومات مؤقتة حول عمليات الإرجاع.
            سنقوم بتحديثها بالتفاصيل الرسمية قريباً.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container max-w-3xl">
          <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">فترة الاستحقاق</h2>
              <p className="text-muted-foreground">
                يتم قبول المرتجعات خلال 7-14 يوماً من تاريخ التسليم، وفقاً لحالة المنتج.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">شروط الحالة</h2>
              <p className="text-muted-foreground">
                يجب أن تكون المنتجات غير مستخدمة، غير مفتوحة، وفي العبوة الأصلية مع إثبات الشراء.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">كيفية طلب الإرجاع</h2>
              <p className="text-muted-foreground">
                اتصل بفريق الدعم مع رقم طلبك وسبب الإرجاع.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">المبالغ المستردة</h2>
              <p className="text-muted-foreground">
                يتم معالجة المبالغ المستردة المعتمدة إلى طريقة الدفع الأصلية خلال 5-10 أيام عمل.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ReturnPolicyPage;