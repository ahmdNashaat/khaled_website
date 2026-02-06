import Layout from '@/components/layout/Layout';

const TermsPage = () => {
  return (
    <Layout>
      <section className="bg-muted/30 py-16">
        <div className="section-container">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">الشروط والأحكام</h1>
          <p className="text-muted-foreground max-w-2xl">
            تحتوي هذه الصفحة على معلومات مؤقتة حول شروطنا.
            سنقوم بتحديثها بالتفاصيل الرسمية قريباً.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="section-container max-w-3xl">
          <div className="bg-white rounded-2xl p-6 shadow-md space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">استخدام الحساب</h2>
              <p className="text-muted-foreground">
                أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">الطلبات والأسعار</h2>
              <p className="text-muted-foreground">
                قد تتغير الأسعار والتوفر دون إشعار مسبق. يتم تأكيد الطلبات بعد معالجتها.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">توفر المنتجات</h2>
              <p className="text-muted-foreground">
                نسعى للدقة، لكن المخزون قد يكون محدوداً. سنتواصل معك إذا لم يكن المنتج متوفراً.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">حدود المسؤولية</h2>
              <p className="text-muted-foreground">
                مسؤوليتنا محدودة بقيمة الطلب وفقاً للقوانين المعمول بها.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TermsPage;