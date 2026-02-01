import Layout from '@/components/layout/Layout';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, MessageCircle, Facebook } from 'lucide-react';
import { storeSettings } from '@/data/mockData';

const AboutPage = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="bg-gradient-to-b from-accent to-background py-16">
        <div className="section-container text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-4xl mb-4 block">🌙</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">من نحن</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              تعرف على قصة متجر مذاق ورحلتنا في تقديم أجود المنتجات الطبيعية
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="section-container">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold mb-6">قصتنا</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                بدأت رحلة متجر مذاق من حب حقيقي للمنتجات الطبيعية والتقليدية التي تميز مائدة الإفطار في شهر رمضان المبارك. نسعى لتقديم أجود أنواع التمور والعسل والمكسرات من مصادرها الأصلية مباشرة إلى بيتك.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                نؤمن بأن الجودة لا تحتاج إلى مساومة. لذلك نختار منتجاتنا بعناية فائقة من أفضل المزارع والموردين، ونضمن لك منتجات طازجة وطبيعية 100% بدون أي إضافات صناعية.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                هدفنا هو أن نكون الوجهة الأولى لكل من يبحث عن منتجات طبيعية بجودة عالية وأسعار منافسة، مع توفير تجربة تسوق سهلة ومريحة عبر خدمة التوصيل السريع.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-muted/30">
        <div className="section-container">
          <h2 className="text-3xl font-bold text-center mb-12">قيمنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '✨',
                title: 'الجودة أولاً',
                description: 'نختار منتجاتنا بعناية فائقة لنضمن لك أفضل جودة'
              },
              {
                icon: '🤝',
                title: 'ثقة العملاء',
                description: 'نبني علاقات طويلة الأمد مبنية على الثقة والشفافية'
              },
              {
                icon: '🚀',
                title: 'خدمة متميزة',
                description: 'نسعى دائماً لتقديم أفضل تجربة تسوق لعملائنا'
              }
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center shadow-md"
              >
                <span className="text-4xl block mb-4">{value.icon}</span>
                <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16">
        <div className="section-container">
          <h2 className="text-3xl font-bold text-center mb-12">تواصل معنا</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <a
              href={`tel:${storeSettings.primaryPhone}`}
              className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">الهاتف</h3>
              <p className="text-muted-foreground" dir="ltr">{storeSettings.primaryPhone}</p>
            </a>
            
            <a
              href={`https://wa.me/${storeSettings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-success/10 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-bold mb-2">واتساب</h3>
              <p className="text-muted-foreground">تواصل معنا مباشرة</p>
            </a>
            
            <a
              href={storeSettings.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-14 h-14 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Facebook className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold mb-2">فيسبوك</h3>
              <p className="text-muted-foreground">تابعنا على فيسبوك</p>
            </a>
            
            <div className="bg-white rounded-2xl p-6 text-center shadow-md">
              <div className="w-14 h-14 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-bold mb-2">العنوان</h3>
              <p className="text-muted-foreground">المنصورة، الدقهلية، مصر</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;
