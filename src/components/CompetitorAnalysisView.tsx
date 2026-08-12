import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, ScatterChart, Scatter, ZAxis,
  LineChart, Line
} from 'recharts';
import { 
  Target, Award, Sparkles, TrendingUp, ArrowLeftRight, AlertCircle
} from 'lucide-react';

interface CompetitorAnalysisViewProps {
  processedData: any[];
  language: 'en' | 'ar';
  darkMode: boolean;
  currentUser?: any;
  brandScope?: 'nova_zenith' | 'vitality_snacks';
}

function CompetitorAnalysisView({ 
  processedData, 
  language, 
  darkMode,
  currentUser,
  brandScope
}: CompetitorAnalysisViewProps) {
  const isEn = language === 'en';

  const allBrands = useMemo(() => {
    return [
      { id: 'nova', label: isEn ? 'Nova Brand' : 'علامة نوفا', key: 'nova', icon: '☕' },
      { id: 'zenith', label: isEn ? 'Zenith Brand' : 'علامة زينيث', key: 'zenith', icon: '🍯' },
      { id: 'vitality_snacks_classic', label: isEn ? 'Vitality Snacks Classic' : 'فايتاليتي سناكس كلاسيك', key: 'vitality_snacks_classic', icon: '🍬' },
      { id: 'vitality_snacks_stevia', label: isEn ? 'Vitality Snacks Stevia' : 'فايتاليتي سناكس ستيفيا', key: 'vitality_snacks_stevia', icon: '🌱' }
    ];
  }, [isEn]);

  const allowedBrands = useMemo(() => {
    if (brandScope === 'vitality_snacks') {
      return allBrands.filter(b => b.id === 'vitality_snacks_classic' || b.id === 'vitality_snacks_stevia');
    }
    if (brandScope === 'nova_zenith') {
      return allBrands.filter(b => b.id === 'nova' || b.id === 'zenith');
    }
    if (!currentUser) return allBrands.slice(0, 2);
    const managed = currentUser.managedBrands || [];
    return allBrands.filter(b => {
      if (b.id === 'nova' || b.id === 'zenith') {
        return managed.includes('nova');
      }
      if (b.id === 'vitality_snacks_classic' || b.id === 'vitality_snacks_stevia') {
        return managed.includes('vitality_snacks');
      }
      return true;
    });
  }, [currentUser, allBrands, brandScope]);

  const [selectedBrand, setSelectedBrand] = useState<string>('nova');

  useEffect(() => {
    if (brandScope === 'vitality_snacks') {
      setSelectedBrand('vitality_snacks_classic');
    } else if (brandScope === 'nova_zenith') {
      setSelectedBrand('nova');
    } else {
      const managed = currentUser?.managedBrands || [];
      if (managed.includes('vitality_snacks') && !managed.includes('nova')) {
        setSelectedBrand('vitality_snacks_classic');
      }
    }
  }, [brandScope, currentUser]);

  // 1. Filter raw sales data for our brand to show real statistics
  const brandSalesData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySales: Record<string, { volume: number; revenue: number }> = {};
    
    // Initialize months
    months.forEach(m => {
      monthlySales[m] = { volume: 0, revenue: 0 };
    });

    processedData.forEach(row => {
      const group = (row.ItemGroup || '').toLowerCase();
      const product = (row.ItemName || '').toLowerCase();
      
      let isMatch = false;
      if (selectedBrand === 'nova') {
        isMatch = group.includes('nova') || product.includes('nova');
      } else if (selectedBrand === 'zenith') {
        isMatch = group.includes('zenith') || product.includes('zenith');
      } else if (selectedBrand === 'vitality_snacks_classic') {
        const isVitalitySnacks = (group.includes('sweet') && group.includes('slim')) || 
                            (product.includes('sweet') && product.includes('slim')) ||
                            product.includes('zero-cal');
        isMatch = isVitalitySnacks && !product.includes('stevia') && !product.includes('mint');
      } else if (selectedBrand === 'vitality_snacks_stevia') {
        const isVitalitySnacks = (group.includes('sweet') && group.includes('slim')) || 
                            (product.includes('sweet') && product.includes('slim')) ||
                            product.includes('zero-cal');
        isMatch = isVitalitySnacks && product.includes('stevia');
      }

      if (isMatch) {
        const dateObj = row.DateObj || new Date(row.Date);
        const monthName = months[dateObj.getMonth()];
        const vol = Math.abs(row.Volume || 0);
        const rev = Math.abs(row.Revenue || 0);
        if (row.IsReturn) {
          monthlySales[monthName].volume -= vol;
          monthlySales[monthName].revenue -= rev;
        } else {
          monthlySales[monthName].volume += vol;
          monthlySales[monthName].revenue += rev;
        }
      }
    });

    return months.map(month => ({
      month: isEn ? month : (
        month === 'Jan' ? 'يناير' : month === 'Feb' ? 'فبراير' : month === 'Mar' ? 'مارس' :
        month === 'Apr' ? 'أبريل' : month === 'May' ? 'مايو' : month === 'Jun' ? 'يونيو' :
        month === 'Jul' ? 'يوليو' : month === 'Aug' ? 'أغسطس' : month === 'Sep' ? 'سبتمبر' :
        month === 'Oct' ? 'أكتوبر' : month === 'Nov' ? 'نوفمبر' : 'ديسمبر'
      ),
      volume: Math.max(0, Math.round(monthlySales[month].volume)),
      revenue: Math.max(0, Math.round(monthlySales[month].revenue))
    }));
  }, [processedData, selectedBrand, language, isEn]);

  // Total sales computed from database for the brand
  const brandSummary = useMemo(() => {
    let totalVol = 0;
    let totalRev = 0;
    brandSalesData.forEach(m => {
      totalVol += m.volume;
      totalRev += m.revenue;
    });
    return { totalVol, totalRev };
  }, [brandSalesData]);

  // 2. Competitor Benchmarking Matrix Data
  const benchmarkData = useMemo(() => {
    if (selectedBrand === 'nova') {
      return [
        { name: 'Nova Koffi & Frappe (Our)', share: 18.5, price: 65, skus: 21, coverage: 78, rating: 8.8, isUs: true },
        { name: 'Nescafé 3-in-1', share: 35.0, price: 55, skus: 12, coverage: 95, rating: 8.2, isUs: false },
        { name: 'Starbucks Instant', share: 6.2, price: 110, skus: 6, coverage: 40, rating: 9.0, isUs: false },
        { name: 'Bonjorno Coffee', share: 18.1, price: 48, skus: 8, coverage: 88, rating: 7.6, isUs: false },
        { name: 'Abu Auf Instant', share: 8.2, price: 75, skus: 15, coverage: 65, rating: 8.5, isUs: false },
        { name: 'Misr Café', share: 5.5, price: 35, skus: 5, coverage: 85, rating: 7.2, isUs: false },
        { name: 'Kofi Break', share: 4.8, price: 32, skus: 4, coverage: 70, rating: 7.0, isUs: false },
        { name: 'Ali Café', share: 3.7, price: 52, skus: 3, coverage: 60, rating: 8.0, isUs: false }
      ];
    } else if (selectedBrand === 'zenith') {
      return [
        { name: 'Zenith Pastes (Our)', share: 24.2, price: 85, skus: 8, coverage: 62, rating: 8.6, isUs: true },
        { name: 'Heinz Chili/Garlic Squeeze', share: 41.5, price: 95, skus: 14, coverage: 92, rating: 8.4, isUs: false },
        { name: 'Durra Culinary Pastes', share: 12.1, price: 75, skus: 6, coverage: 82, rating: 7.9, isUs: false },
        { name: 'Harvest Savory Pastes', share: 10.2, price: 60, skus: 5, coverage: 70, rating: 7.5, isUs: false },
        { name: 'Gardino Pastes', share: 6.5, price: 55, skus: 4, coverage: 75, rating: 7.8, isUs: false },
        { name: 'Don Lopez Chili', share: 5.5, price: 72, skus: 3, coverage: 50, rating: 7.7, isUs: false }
      ];
    } else if (selectedBrand === 'vitality_snacks_classic') {
      return [
        { name: isEn ? 'Vitality Snacks Classic (Our)' : 'سويت آند سليم كلاسيك (منتجنا)', share: 21.4, price: 42, skus: 15, coverage: 72, rating: 8.5, isUs: true },
        { name: 'Canderel Classic', share: 32.6, price: 68, skus: 8, coverage: 90, rating: 8.3, isUs: false },
        { name: 'Sweetal (Sucralose)', share: 18.5, price: 58, skus: 6, coverage: 85, rating: 8.6, isUs: false },
        { name: 'Sugar Match', share: 11.2, price: 45, skus: 5, coverage: 80, rating: 7.9, isUs: false },
        { name: 'Diet Sweet', share: 8.2, price: 35, skus: 5, coverage: 80, rating: 7.4, isUs: false },
        { name: 'Iso-Sweet', share: 4.8, price: 50, skus: 6, coverage: 65, rating: 8.0, isUs: false },
        { name: 'NoCal', share: 3.3, price: 48, skus: 4, coverage: 55, rating: 7.7, isUs: false }
      ];
    } else {
      return [
        { name: isEn ? 'Vitality Snacks Stevia (Our)' : 'سويت آند سليم ستيفيا (منتجنا)', share: 16.8, price: 75, skus: 10, coverage: 58, rating: 8.7, isUs: true },
        { name: 'Canderel Green (Stevia)', share: 28.2, price: 110, skus: 6, coverage: 82, rating: 8.5, isUs: false },
        { name: 'Splenda Stevia', share: 22.5, price: 135, skus: 4, coverage: 45, rating: 9.0, isUs: false },
        { name: 'Imtenan Stevia', share: 14.5, price: 95, skus: 3, coverage: 75, rating: 8.4, isUs: false },
        { name: 'Stevia Diabetna', share: 10.0, price: 85, skus: 3, coverage: 60, rating: 8.1, isUs: false },
        { name: 'Suga Stevia', share: 8.0, price: 65, skus: 3, coverage: 50, rating: 7.9, isUs: false }
      ];
    }
  }, [selectedBrand, isEn]);

  const ourShare = useMemo(() => {
    const us = benchmarkData.find(b => b.isUs);
    return us ? `${us.share}%` : '0%';
  }, [benchmarkData]);

    // 3. Marketing Channel & Ad Spend Comparison Data
  const marketingSpendData = useMemo(() => {
    if (selectedBrand === 'nova') {
      return [
        { channel: isEn ? 'Social Media' : 'وسائل التواصل', ourBrand: 120000, competitorA: 350000, competitorB: 180000 },
        { channel: isEn ? 'TV & Billboards' : 'التلفزيون واللافتات', ourBrand: 250000, competitorA: 900000, competitorB: 100000 },
        { channel: isEn ? 'In-Store Sampling' : 'تذوق داخل المتجر', ourBrand: 95000, competitorA: 150000, competitorB: 50000 },
        { channel: isEn ? 'Digital Search / SEO' : 'البحث الرقمي', ourBrand: 45000, competitorA: 120000, competitorB: 140000 }
      ];
    } else if (selectedBrand === 'zenith') {
      return [
        { channel: isEn ? 'Social Media' : 'وسائل التواصل', ourBrand: 65000, competitorA: 280000, competitorB: 95000 },
        { channel: isEn ? 'TV & Billboards' : 'التلفزيون واللافتات', ourBrand: 80000, competitorA: 750000, competitorB: 200000 },
        { channel: isEn ? 'In-Store / Hypermarkets' : 'تنشيط بالهايبر ماركت', ourBrand: 110000, competitorA: 300000, competitorB: 150000 },
        { channel: isEn ? 'Bundling Promotions' : 'عروض الحزم المشتركة', ourBrand: 40000, competitorA: 120000, competitorB: 50000 }
      ];
    } else {
      return [
        { channel: isEn ? 'Social Media' : 'وسائل التواصل', ourBrand: 90000, competitorA: 220000, competitorB: 110000 },
        { channel: isEn ? 'Medical Detailing / Doctors' : 'الزيارات الطبية والأطباء', ourBrand: 150000, competitorA: 310000, competitorB: 160000 },
        { channel: isEn ? 'Pharmacy Sampling / Activations' : 'تنشيط الصيدليات', ourBrand: 85000, competitorA: 180000, competitorB: 90000 },
        { channel: isEn ? 'Digital Ads / PPC' : 'الإعلانات الرقمية المدفوعة', ourBrand: 60000, competitorA: 150000, competitorB: 100000 }
      ];
    }
  }, [selectedBrand, isEn]);

  const swotData = useMemo(() => {
    if (selectedBrand === 'nova') {
      return {
        strengths: isEn 
          ? ['Premium Egyptian local brand alignment.', 'Rich flavour profiles (Mocha, Caramel, Pistachio).', 'High quality sachet design & box packaging.'] 
          : ['التوافق مع اتجاه دعم المنتجات المحلية المصرية.', 'نكهات غنية ومتنوعة (كراميل، فستق، موكا).', 'تصميم عبوات وأكياس متميز وجذاب.'],
        weaknesses: isEn
          ? ['Lower distribution coverage in traditional grocery vs Nescafe.', 'Production capacity limits during raw materials import.', 'Premium price limit compared to low-tier instant alternatives.']
          : ['تغطية توزيع أقل في محلات البقالة التقليدية مقارنة بنيسكافيه.', 'قيود على الطاقة الإنتاجية أثناء استيراد المواد الخام.', 'حد سعري مرتفع نسبياً مقارنة بالبدائل سريعة التحضير منخفضة التكلفة.'],
        opportunities: isEn
          ? ['Expand single-serve portfolio into HORECA hotels & offices.', 'Introduce Cold Brew / Frappe Ready-To-Drink (RTD) cans.', 'Co-branding campaigns with local dessert brands.']
          : ['توسيع محفظة الأكياس الفردية لتشمل الفنادق والمكاتب (HORECA).', 'تقديم عبوات جاهزة للشرب (RTD) من القهوة الباردة والفرابيه.', 'حملات تسويقية مشتركة مع علامات تجارية محلية للحلويات.'],
        threats: isEn
          ? ['Nescafe aggressive pricing discounts and loyalty schemes.', 'Fluctuation in cocoa and coffee bean import tariffs.', 'Imitation brands copying flavour packaging layouts.']
          : ['خصومات الأسعار الهجومية وبرامج الولاء من نيسكافيه.', 'تقلبات أسعار الصرف والتعريفات الجمركية على حبوب البن.', 'العلامات التجارية المقلدة التي تنسخ تصاميم نكهات نوفا.']
      };
    } else if (selectedBrand === 'zenith') {
      return {
        strengths: isEn
          ? ['Highly convenient and clean squeezable tube/bottle design.', 'Fresh minced texture (Chili & Garlic) vs competitor dry powders.', 'High appeal as a local Egyptian alternative.']
          : ['تصميم عبوة ضغط مريح ونظيف سهل الاستخدام.', 'قوام مفروم طازج (فلفل وثوم) مقارنة بمسحوق البودرة المجفف للمنافسين.', 'جاذبية قوية كبديل محلي مصري متميز.'],
        weaknesses: isEn
          ? ['Higher shelf cost than basic canned glass jars of Durra.', 'Low brand awareness in rural and traditional trade kiosks.', 'Limited variety of packaging sizes.']
          : ['تكلفة رف أعلى مقارنة ببرطمانات زجاج درة التقليدية.', 'وعي منخفض بالعلامة التجارية في الريف ومحلات البقالة التقليدية.', 'خيارات محدونة لأحجام التعبئة والتغليف.'],
        opportunities: isEn
          ? ['Launch larger HORECA bulk tubes for restaurant kitchen supplies.', 'Expand flavor range to ginger-garlic paste and coriander chili paste.', 'Partner with quick-commerce platforms for instant dinner-prep bundles.']
          : ['إطلاق عبوات حجم كبير لقطاع HORECA وتوريد المطابخ المطاعم.', 'توسيع تشكيلة النكهات لمعجون الثوم والزنجبيل ومعجون الفلفل بالكزبرة.', 'الشراكة مع منصات التجارة السريعة لتقديم حزم تحضير العشاء الفورية.'],
        threats: isEn
          ? ['Heinz aggressive pricing promotions and deep discount bundles.', 'Price volatility of fresh garlic and chili raw crops.', 'Private label supermarket brands copying squeeze paste models.']
          : ['خصومات الأسعار وعروض الحزم الترويجية الهجومية من هاينز.', 'تقلبات أسعار المحاصيل الزراعية الطازجة للثوم والفلفل.', 'العلامات التجارية الخاصة بالسوبرماركت التي تنسخ فكرة معجون الضغط.']
      };
    } else if (selectedBrand === 'vitality_snacks_classic') {
      return {
        strengths: isEn
          ? ['Zero metallic aftertaste due to high-quality sucralose formulation.', 'Extremely trusted local Egyptian brand with strong pharmacy referral.', 'Convenient multi-sachet boxes (50, 100, 400 counts).']
          : ['خالي تماماً من الطعم المعدني بسبب تركيبة السكرالوز عالية الجودة.', 'علامة تجارية مصرية موثوقة للغاية مع توصيات قوية من الصيادلة.', 'عبوات مريحة متعددة الأكياس (٥٠، ١٠٠، ٤٠٠ كيس).'],
        weaknesses: isEn
          ? ['Sucralose raw material costs fluctuate with exchange rate.', 'Slightly higher pricing than basic low-end saccharin brands (Diet Sweet).', 'Low visibility in small traditional cafes.']
          : ['تذبذب تكاليف السكرالوز المستورد مع سعر الصرف.', 'سعر أعلى قليلاً من العلامات التجارية الرخيصة التي تعتمد على السكرين.', 'تأثير بصري منخفض في المقاهي الشعبية والتقليدية.'],
        opportunities: isEn
          ? ['Expand distribution to large corporate offices & gyms.', 'Develop liquid sucralose drops for hot and cold drinks.', 'Bundle with Egyptian herbal tea brands in hypermarkets.']
          : ['توسيع التوزيع للشركات الكبرى والصالات الرياضية (Gyms).', 'تطوير محلي سائل سكرالوز سريع الذوبان للمشروبات.', 'تقديم حزم ترويجية مع شاي الأعشاب المصري في الهايبر ماركت.'],
        threats: isEn
          ? ['Canderel Classic deep discount promotions in pharmacy chains.', 'Rising consumer interest in natural plant sweeteners over artificial ones.', 'Local private label sweeteners copying box designs.']
          : ['عروض الخصومات الكبيرة من كانديريل في سلاسل الصيدليات.', 'تزايد اهتمام المستهلكين بالمحليات النباتية الطبيعية على حساب البدائل الصناعية.', 'العلامات التجارية الخاصة بالهايبر ماركت التي تنسخ شكل العبوة.']
      };
    } else {
      return {
        strengths: isEn
          ? ['Natural plant-based Stevia extract formulation, 100% Aspartame-free.', 'No bitter licorice-like aftertaste compared to low-cost stevia.', 'Strong premium healthy positioning for diabetics and keto dieters.']
          : ['تركيبة تعتمد على مستخلص الستيفيا النباتي الطبيعي، خالي ١٠٠٪ من الأسبرتام.', 'خالي من المرارة المتبقية في الفم مقارنة بالستيفيا الرخيصة.', 'تموضع صحي متميز لمرضى السكري ومتبعي حمية الكيتو.'],
        weaknesses: isEn
          ? ['High cost of raw Rebaudioside-A stevia leaves limits price reductions.', 'Limited shelf space in small traditional retail grocers.', 'Consumer perception that stevia tastes different than sugar.']
          : ['ارتفاع تكلفة أوراق الستيفيا الخام يحد من مرونة خفض الأسعار.', 'مساحة رف محدونة في محلات البقالة التقليدية الصغيرة.', 'انطباع بعض المستهلكين بأن طعم الستيفيا يختلف قليلاً عن السكر الأبيض.'],
        opportunities: isEn
          ? ['Partner with weight-loss centers and clinical dieticians.', 'Launch Vitality Snacks Sugar-Free Coffee Syrups (Vanilla, Caramel).', 'Launch high-volume baking stevia bags for diet pastries.']
          : ['الشراكة مع مراكز التخسيس وأخصائيي التغذية العلاجية.', 'إطلاق شراب (سيرب) خالي من السكر بنكهات الفانيليا والكراميل للمقاهي.', 'توفير عبوات ستيفيا كبيرة الحجم مخصصة للخبز والحلويات الدايت.'],
        threats: isEn
          ? ['Splenda Stevia medical detailing and doctor sponsorship campaigns.', 'Suga Stevia aggressive price cuts in hypermarkets.', 'Flooding of cheap, uncertified bulk stevia powder online.']
          : ['حملات الرعاية الطبية وأبحاث الأطباء المدعومة من سبليندا ستيفيا.', 'تخفيضات الأسعار الحادة من سوجا ستيفيا في الهايبر ماركت.', 'إغراق السوق ببودرة ستيفيا رخيصة وغير مرخصة عبر الإنترنت.']
      };
    }
  }, [selectedBrand, isEn]);

  // 5. Competitor Feed / Market Reviews
  const reviews = useMemo(() => {
    if (selectedBrand === 'nova') {
      return [
        { competitor: 'Nescafé 3-in-1', feedback: isEn ? 'Tastes diluted compared to Nova, but Nescafe is available in literally every kiosk.' : 'طعمه مخفف مقارنة بنوفا، لكن نيسكافيه متوفر حرفياً في كل كشك بقالة.', source: 'B2C Retail Survey', sentiment: 'neutral', action: isEn ? 'Increase traditional trade kiosk POS visibility.' : 'زيادة التواجد والإعلانات عند نقاط البيع للأكشاك التقليدية.' },
        { competitor: 'Starbucks Instant', feedback: isEn ? 'Premium taste but overpriced for daily consumption. Nova is the perfect alternative.' : 'طعم متميز ولكن سعره مبالغ فيه للاستهلاك اليومي. نوفا هي البديل المثالي.', source: 'Social Media Review', sentiment: 'positive', action: isEn ? 'Target premium users with "Café Quality at 50% Cost" campaign.' : 'استهداف المستهلكين بحملة "جودة المقهى بنصف التكلفة".' },
        { competitor: 'Bonjorno Coffee', feedback: isEn ? 'Cheap and sweet, but has chemical aftertaste. Nova is much smoother.' : 'رخيص وحلو، لكن له طعم صناعي بعد تذوقه. نوفا أكثر سلاسة وجودة.', source: 'Focus Group Audit', sentiment: 'positive', action: isEn ? 'Highlight "Zero Artificial Flavours" on Nova packaging.' : 'إبراز عبارة "نكهات طبيعية بالكامل" على عبوات نوفا.' }
      ];
    } else if (selectedBrand === 'zenith') {
      return [
        { competitor: 'Heinz Chili Squeeze', feedback: isEn ? 'Heinz has good heat, but Zenith Garlic and Chili pastes taste much fresher like real minced garlic.' : 'هاينز يعطي حرارة جيدة، لكن معجون الثوم والفلفل من زينيث طعمه طازج جداً كأنه ثوم مفروم حقيقي.', source: 'In-Store Intercept', sentiment: 'positive', action: isEn ? 'Run campaign focusing on "Real Fresh Garlic & Chili taste - No Powdered substitutes".' : 'إطلاق حملة تركز على "طعم الثوم والفلفل الطازج الحقيقي - بدون بدائل مجففة".' },
        { competitor: 'Durra Culinary Pastes', feedback: isEn ? 'Durra jars are messy and need a spoon. Zenith bottles are much cleaner for cooking.' : 'برطمانات درة تسبب الفوضى وتحتاج إلى ملعقة للاستخدام. عبوة زينيث أنظف بكثير عند الطهي.', source: 'Culinary Audit', sentiment: 'positive', action: isEn ? 'Highlight "Clean Culinary Squeeze" convenience in social media cooking reels.' : 'إبراز ميزة "ضغط نظيف للطهي السهل" في مقاطع الطبخ على منصات التواصل الاجتماعي.' }
      ];
    } else {
      return [
        { competitor: 'Canderel Classic', feedback: isEn ? 'Canderel tastes sweet but leaves a persistent metallic aftertaste. Vitality Snacks Classic is much more natural.' : 'كانديريل حلو المذاق لكنه يترك طعماً معدنياً باقياً في الفم. سويت آند سليم كلاسيك طعمه طبيعي أكثر.', source: 'Pharmacy Intercept Survey', sentiment: 'positive', action: isEn ? 'Highlight Vitality Snacks "No Metallic Aftertaste" in pharmacy ads.' : 'التركيز على ميزة "بدون طعم معدني متبقي" في إعلانات الصيدليات.' },
        { competitor: 'Splenda Stevia', feedback: isEn ? 'Splenda Stevia has excellent taste, but is extremely expensive for daily tea drinkers. Vitality Snacks Stevia is the best economical choice.' : 'سبليندا ستيفيا طعمها ممتاز، ولكنها باهظة الثمن جداً لمن يشربون الشاي يومياً. سويت آند سليم ستيفيا خيار اقتصادي رائع.', source: 'Customer Sentiment Log', sentiment: 'positive', action: isEn ? 'Market Vitality Snacks Stevia as "Daily Natural Sweetness at a Smart Price".' : 'تسويق سويت آند سليم ستيفيا كحملة "حلاوة طبيعية يومية بسعر ذكي".' },
        { competitor: 'Diet Sweet', feedback: isEn ? 'Diet Sweet is very cheap but has saccharin, which makes doctors advise against it. Vitality Snacks Stevia is far healthier.' : 'دايت سويت رخيص جداً ولكنه يحتوي على السكرين، مما يجعل الأطباء ينصحون بعدمه. سويت آند سليم ستيفيا أكثر صحية وأماناً.', source: 'Medical Forum Audit', sentiment: 'positive', action: isEn ? 'Highlight "Zero Aspartame / Zero Saccharin" on stevia pack fronts.' : 'تأكيد عبارة "خالي من الأسبرتام والسكرين" بشكل بارز على عبوات ستيفيا.' }
      ];
    }
  }, [selectedBrand, isEn]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Brand Competitor Insights & Market Research' : 'تحليلات المنافسين وأبحاث السوق للعلامة التجارية'}
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} mt-1`}>
            {isEn 
              ? 'Analyze market share, competitor pricing strategies, and strategic brand positioning for brand growth.' 
              : 'تحليل الحصة السوقية، واستراتيجيات تسعير المنافسين، والتموضع الاستراتيجي لنمو العلامة التجارية.'}
          </p>
        </div>

        {/* Brand Selector Toggles */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/60 no-print select-none">
          {allowedBrands.map(b => (
            <button
              key={b.id}
              onClick={() => setSelectedBrand(b.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                selectedBrand === b.id 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'text-slate-400 dark:text-slate-300 hover:text-slate-600'
              }`}
            >
              {b.icon} {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brand Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isEn ? 'Internal Sales Volume (database)' : 'حجم المبيعات الداخلي (قاعدة البيانات)'}
              </p>
              <h3 className="text-xl font-black mt-2 text-indigo-500">
                {brandSummary.totalVol.toLocaleString()} {isEn ? 'Units' : 'وحدة'}
              </h3>
            </div>
            <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isEn ? 'Internal Net Revenue' : 'صافي الإيرادات الداخلية'}
              </p>
              <h3 className="text-xl font-black mt-2 text-[#128d46]">
                {brandSummary.totalRev.toLocaleString()} {isEn ? 'EGP' : 'ج.م'}
              </h3>
            </div>
            <div className="p-2 bg-emerald-500/10 text-[#128d46] rounded-lg">
              <Award size={18} />
            </div>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isEn ? 'Market Penetration Index' : 'مؤشر تغلغل السوق'}
              </p>
              <h3 className="text-xl font-black mt-2 text-[#e97025]">
                {ourShare}
              </h3>
            </div>
            <div className="p-2 bg-amber-500/10 text-[#e97025] rounded-lg">
              <Sparkles size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Sales Trend vs Competitor Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Real Brand Sales Trend (database-backed) */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Brand Internal Sales Trend' : 'مسار المبيعات الداخلية للعلامة التجارية'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={brandSalesData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="month" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="revenue" name={isEn ? 'Revenue (EGP)' : 'الإيرادات (ج.م)'} stroke="#128d46" strokeWidth={3} />
                <Line type="monotone" dataKey="volume" name={isEn ? 'Volume (Units)' : 'حجم الكميات (وحدة)'} stroke="#e97025" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Competitor Benchmarking Matrix */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm flex flex-col justify-between`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Competitor Benchmarking Matrix' : 'مصفوفة مقارنة المنافسين'}
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'} border-b font-bold`}>
                  <th className="p-2.5">{isEn ? 'Brand / Competitor' : 'العلامة / المنافس'}</th>
                  <th className="p-2.5 text-right">{isEn ? 'Market Share' : 'حصة السوق'}</th>
                  <th className="p-2.5 text-right">{isEn ? 'Avg Price' : 'متوسط السعر'}</th>
                  <th className="p-2.5 text-right">{isEn ? 'SKU Count' : 'عدد الأصناف'}</th>
                  <th className="p-2.5 text-right">{isEn ? 'Coverage' : 'التغطية'}</th>
                  <th className="p-2.5 text-right">{isEn ? 'Sentiment' : 'التقييم'}</th>
                </tr>
              </thead>
              <tbody>
                {benchmarkData.map((row, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-b ${darkMode ? 'border-slate-800/60' : 'border-slate-200'} ${
                      row.isUs 
                        ? 'bg-indigo-500/10 font-bold dark:bg-indigo-500/20' 
                        : 'hover:bg-slate-100/50'
                    }`}
                  >
                    <td className="p-2.5 flex items-center gap-1.5">
                      {row.isUs && <span className="text-indigo-500 text-[10px]">⭐</span>}
                      {row.name}
                    </td>
                    <td className="p-2.5 text-right">{row.share}%</td>
                    <td className="p-2.5 text-right">{row.price} EGP</td>
                    <td className="p-2.5 text-right">{row.skus}</td>
                    <td className="p-2.5 text-right">{row.coverage}%</td>
                    <td className="p-2.5 text-right text-amber-500 font-bold">★ {row.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Positioning & Marketing Spend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Price vs Quality Positioning Matrix */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Brand Positioning & Value Matrix' : 'مصفوفة التموضع وقيمة العلامة التجارية'}
          </h3>
          <p className="text-[10px] text-slate-400 mb-4">
            {isEn ? 'Scatter position maps average price vs consumer taste/quality score.' : 'توضح نقاط الانتشار متوسط السعر مقابل تقييم الجودة والطعم لدى المستهلكين.'}
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis type="number" dataKey="price" name="Price" unit=" EGP" label={{ value: isEn ? 'Price' : 'السعر', position: 'bottom', offset: -5, fontSize: 9 }} stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} />
                <YAxis type="number" dataKey="rating" name="Rating" domain={[7, 10]} label={{ value: isEn ? 'Quality Score' : 'تقييم الجودة', angle: -90, position: 'insideLeft', fontSize: 9 }} stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={9} />
                <ZAxis type="category" dataKey="name" name="Brand" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Brands" data={benchmarkData} fill="#6366f1">
                  {benchmarkData.map((entry, index) => (
                    <circle 
                      key={`cell-${index}`} 
                      cx={0} 
                      cy={0} 
                      r={entry.isUs ? 10 : 7} 
                      fill={entry.isUs ? '#128d46' : '#e97025'} 
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Marketing Channel & Campaign Spend */}
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
          <h3 className={`text-xs font-black uppercase tracking-wider mb-4 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Marketing Campaign & Ad Spend Share' : 'حصة الإنفاق الإعلاني وحملات التسويق'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={marketingSpendData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="channel" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={10} />
                <Tooltip formatter={(val: any) => `${Number(val).toLocaleString()} EGP`} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar 
                  dataKey="ourBrand" 
                  name={selectedBrand === 'nova' ? (isEn ? 'Nova (Our)' : 'نوفا (منتجنا)') : (isEn ? 'Zenith (Our)' : 'زينيث (منتجنا)')} 
                  fill="#128d46" 
                  radius={[3, 3, 0, 0]} 
                />
                <Bar 
                  dataKey="competitorA" 
                  name={selectedBrand === 'nova' ? 'Nescafé' : 'Heinz'} 
                  fill="#cbd5e1" 
                  radius={[3, 3, 0, 0]} 
                />
                <Bar 
                  dataKey="competitorB" 
                  name={selectedBrand === 'nova' ? 'Starbucks' : 'Vitrac'} 
                  fill="#e97025" 
                  radius={[3, 3, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SWOT Analysis Matrix */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <h3 className={`text-xs font-black uppercase tracking-wider mb-6 ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
          {isEn ? `Strategic SWOT Matrix: ${selectedBrand.toUpperCase()}` : `مصفوفة التحليل الرباعي الاستراتيجي لعلامة ${selectedBrand.toUpperCase()}`}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Strengths */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10">
            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
              🟢 {isEn ? 'Strengths (S)' : 'نقاط القوة'}
            </h4>
            <ul className="space-y-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 list-disc pl-4">
              {swotData.strengths.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10">
            <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 mb-3 flex items-center gap-1.5">
              🔴 {isEn ? 'Weaknesses (W)' : 'نقاط الضعف'}
            </h4>
            <ul className="space-y-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 list-disc pl-4">
              {swotData.weaknesses.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10">
            <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
              🔵 {isEn ? 'Opportunities (O)' : 'الفرص المتاحة'}
            </h4>
            <ul className="space-y-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 list-disc pl-4">
              {swotData.opportunities.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10">
            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
              🟡 {isEn ? 'Threats (T)' : 'التهديدات'}
            </h4>
            <ul className="space-y-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 list-disc pl-4">
              {swotData.threats.map((str, idx) => (
                <li key={idx}>{str}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Competitor Sentiment Feed & strategic opportunities */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800/50 border-slate-700/60' : 'bg-white border-slate-200'} shadow-sm`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className={`text-xs font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#191342]'}`}>
            {isEn ? 'Competitor Social Sentiment Feed & Actions' : 'تغذية آراء المستهلكين ومقترحات التحرك الاستراتيجي'}
          </h3>
          <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">
            {isEn ? 'Active Market Research' : 'بحث السوق النشط'}
          </span>
        </div>

        <div className="space-y-4">
          {reviews.map((rev, idx) => (
            <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800/30 border-slate-700/60' : 'bg-slate-50/50 border-slate-200'} flex flex-col md:flex-row justify-between gap-4 text-xs`}>
              <div className="space-y-1.5 md:max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 dark:text-slate-200">{rev.competitor}</span>
                  <span className="text-[9px] uppercase text-slate-400 font-extrabold bg-slate-200/50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {rev.source}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 italic">"{rev.feedback}"</p>
              </div>

              <div className="md:min-w-[250px] flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 pt-3 md:pt-0 md:pl-4">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block mb-1">
                  💡 {isEn ? 'Strategic Counter-Action:' : 'التحرك الاستراتيجي المضاد:'}
                </span>
                <p className="font-bold text-slate-700 dark:text-slate-300">{rev.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(CompetitorAnalysisView);
