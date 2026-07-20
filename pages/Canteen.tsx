
import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { dataService } from '../services/dataService';
import { Product, FoodOrder, OrderItem } from '../types';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Clock, 
  Calendar, 
  Smartphone, 
  MessageCircle, 
  Info,
  History,
  AlertTriangle,
  ArrowRight,
  Coffee,
  Utensils
} from 'lucide-react';

const Canteen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Form State
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [studentClass, setStudentClass] = useState('Prépa 1');
  const [phone, setPhone] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const levels = ["B1 COM", "B1 CREA", "B1 DEV", "B2 COM", "B2 CREA", "B2 DEV", "B3 COM", "B3 CREA", "B3 DEV", "Master 1", "Master 2"];
  const WAVE_PAYMENT_URL = "https://pay.wave.com/m/M_ci_He_doa4nnxia/c/ci/";
  
  const WHATSAPP_MESSAGE = "Bonjour Mme Loua, je viens de passer ma commande sur le site du BDE, je vous envoie de ce pas la capture d'écran de mon paiement Wave pour la validation de ma commande.";
  const MANAGER_WHATSAPP_URL = `https://api.whatsapp.com/send/?phone=2250705110409&text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  useEffect(() => {
    const loadData = async () => {
      const p = await dataService.fetchProducts();
      setProducts(p.filter(item => item.isAvailable));
      
      const storedPhone = localStorage.getItem('canteen_phone');
      if (storedPhone) {
        setPhone(storedPhone);
        const allOrders = await dataService.fetchFoodOrders();
        setOrders(allOrders.filter(o => o.studentPhone === storedPhone).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // Groupement des produits par catégorie
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      let cat = p.category || "Autres";
      // Renommage demandé
      if (cat.toLowerCase().includes("midi") || cat.toLowerCase().includes("déjeuner") && !cat.toLowerCase().includes("petit")) {
        cat = "Le Déjeuner";
      }
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [products]);

  // Ordre de priorité des catégories pour l'affichage
  const categoryOrder = ["Petit Déjeuner", "Le Déjeuner"];

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing) {
      setCart(cart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { productId: product.id, productName: product.name, quantity: 1, price: product.price }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return alert("Votre panier est vide !");
    
    setIsSubmitting(true);
    const newOrder: Omit<FoodOrder, 'id'> = {
      studentName: lastName,
      studentFirstName: firstName,
      studentClass,
      studentPhone: phone,
      items: cart,
      totalPrice,
      pickupDate,
      pickupTime,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await dataService.addFoodOrder(newOrder);
      localStorage.setItem('canteen_phone', phone);
      setCart([]);
      setNotes('');
      alert("Commande enregistrée ! N'oubliez pas d'effectuer le paiement Wave et d'envoyer la capture.");
      
      const allOrders = await dataService.fetchFoodOrders();
      setOrders(allOrders.filter(o => o.studentPhone === phone).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setShowHistory(true);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'validated': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'preparing': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'ready': return 'bg-green-100 text-green-600 border-green-200';
      case 'delivered': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente de paiement';
      case 'validated': return 'Payée / Validée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête à être récupérée';
      case 'delivered': return 'Récupérée';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-black text-bde-navy mb-2">La Cantine <span className="text-bde-rose">IFRAN</span></h1>
            <p className="text-gray-500 font-medium">Commandez votre repas, gagnez du temps.</p>
          </div>
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 bg-white text-bde-navy px-6 py-3 rounded-2xl border-2 border-gray-100 font-bold hover:shadow-md transition"
          >
            {showHistory ? <ShoppingBag size={20}/> : <History size={20} />}
            {showHistory ? "Voir la Carte" : "Mes Commandes"}
          </button>
        </div>

        {showHistory ? (
          <div className="space-y-6 animate-fade-in">
             <h2 className="text-2xl font-bold text-bde-navy mb-8">Historique & Suivi</h2>
             {orders.length > 0 ? (
               <div className="grid gap-6">
                 {orders.map(order => (
                   <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6 hover:shadow-md transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                           <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase border ${getStatusColor(order.status)}`}>
                             {getStatusLabel(order.status)}
                           </span>
                           <span className="text-xs text-gray-400 font-bold uppercase">{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-bold text-lg text-bde-navy mb-2">
                           {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                           <div className="flex items-center gap-1"><Calendar size={14}/> Retrait le {order.pickupDate}</div>
                           <div className="flex items-center gap-1"><Clock size={14}/> à {order.pickupTime}</div>
                        </div>
                      </div>
                      <div className="md:text-right flex flex-col justify-between items-start md:items-end">
                         <span className="text-xl font-black text-bde-navy">{order.totalPrice} FCFA</span>
                         {order.status === 'pending' && (
                           <div className="flex gap-2 mt-4">
                              <a href={WAVE_PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600 transition">Payer Wave</a>
                              <a href={MANAGER_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600 transition">Envoyer Capture</a>
                           </div>
                         )}
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
               <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-100">
                  <History size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">Aucune commande trouvée.</p>
               </div>
             )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            {/* MENU SECTION */}
            <div className="lg:col-span-2 space-y-12">
              {loading ? (
                <div className="grid sm:grid-cols-2 gap-8">
                  {Array.from({length: 4}).map((_,i) => <div key={i} className="bg-gray-200 h-64 rounded-3xl animate-pulse"></div>)}
                </div>
              ) : Object.keys(groupedProducts).length > 0 ? (
                <div className="space-y-16">
                  {/* On affiche d'abord les catégories prioritaires, puis les autres */}
                  {[...categoryOrder, ...Object.keys(groupedProducts).filter(c => !categoryOrder.includes(c))].map(categoryName => {
                    const categoryItems = groupedProducts[categoryName];
                    if (!categoryItems) return null;
                    
                    return (
                      <div key={categoryName} className="animate-fade-in-up">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="bg-bde-rose/10 p-3 rounded-2xl text-bde-rose">
                            {categoryName === "Petit Déjeuner" ? <Coffee size={24}/> : <Utensils size={24}/>}
                          </div>
                          <h2 className="text-2xl font-black text-bde-navy uppercase tracking-tight">{categoryName}</h2>
                          <div className="h-px bg-gray-200 flex-1 ml-2"></div>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-8">
                          {categoryItems.map(product => (
                            <div key={product.id} className="bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group">
                              <div className="h-48 bg-gray-100 relative overflow-hidden">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">Image indisponible</div>
                                )}
                              </div>
                              <div className="p-6">
                                <h3 className="font-black text-xl text-bde-navy mb-2">{product.name}</h3>
                                <div className="flex justify-between items-center mt-4">
                                   <span className="text-lg font-black text-bde-rose">{product.price} FCFA</span>
                                   <button 
                                    onClick={() => addToCart(product)}
                                    className="bg-bde-navy text-white p-3 rounded-2xl hover:bg-bde-rose transition-all shadow-md active:scale-90"
                                   >
                                     <Plus size={20} />
                                   </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-24 text-gray-400 font-bold italic">
                  Aucun plat disponible aujourd'hui.
                </div>
              )}
            </div>

            {/* CART & HELP SECTION */}
            <div className="lg:col-span-1">
               <div className="lg:sticky lg:top-24 space-y-8">
                 <div className="bg-white rounded-[40px] p-8 shadow-2xl border-2 border-gray-50">
                    <h3 className="text-2xl font-black text-bde-navy mb-8 flex items-center gap-3">
                      <ShoppingBag className="text-bde-rose" /> Votre Panier
                    </h3>

                    {cart.length > 0 ? (
                      <>
                        <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2 no-scrollbar">
                           {cart.map(item => (
                             <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                                <div className="flex-1">
                                  <h4 className="font-bold text-bde-navy text-sm">{item.productName}</h4>
                                  <span className="text-xs text-gray-400 font-bold">{item.price} F / unité</span>
                                </div>
                                <div className="flex items-center gap-3">
                                   <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:text-bde-rose"><Minus size={16}/></button>
                                   <span className="font-black text-bde-navy text-sm">{item.quantity}</span>
                                   <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:text-bde-rose"><Plus size={16}/></button>
                                   <button onClick={() => removeFromCart(item.productId)} className="ml-2 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                                </div>
                             </div>
                           ))}
                        </div>

                        <div className="flex justify-between items-center mb-8 pt-6 border-t border-gray-100">
                          <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Total à payer</span>
                          <span className="text-2xl font-black text-bde-rose">{totalPrice} FCFA</span>
                        </div>

                        <form onSubmit={handleSubmitOrder} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Nom" required className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-bde-rose" value={lastName} onChange={e => setLastName(e.target.value)} />
                            <input type="text" placeholder="Prénom" required className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-bde-rose" value={firstName} onChange={e => setFirstName(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <select className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-bde-rose" value={studentClass} onChange={e => setStudentClass(e.target.value)}>
                              {levels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <input type="tel" placeholder="Téléphone" required className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-bde-rose" value={phone} onChange={e => setPhone(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <Calendar className="absolute left-3 top-3 text-gray-300" size={16}/>
                              <input type="date" required className="w-full bg-gray-50 border-none p-3 pl-10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-bde-rose [color-scheme:light]" value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
                            </div>
                            <div className="relative">
                              <Clock className="absolute left-3 top-3 text-gray-300" size={16}/>
                              <input type="time" required className="w-full bg-gray-50 border-none p-3 pl-10 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-bde-rose [color-scheme:light]" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
                            </div>
                          </div>
                          <textarea placeholder="Précisions..." className="w-full bg-gray-50 border-none p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-bde-rose h-20 resize-none" value={notes} onChange={e => setNotes(e.target.value)}></textarea>

                          <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 space-y-2">
                             <div className="flex gap-2 text-orange-800 font-black text-[10px] uppercase">
                                <AlertTriangle size={14}/> Note Importante
                             </div>
                             <p className="text-[10px] text-orange-600 font-medium leading-relaxed">
                               Si vous vous trompez sur la date, votre commande pourrait ne pas être prise en compte. 
                               <strong> Le paiement Wave est obligatoire avant validation.</strong>
                             </p>
                          </div>

                          <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-bde-rose text-white py-4 rounded-2xl font-black shadow-xl hover:shadow-rose-500/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                          >
                            {isSubmitting ? "Enregistrement..." : "Confirmer ma commande"}
                            <ArrowRight size={20}/>
                          </button>
                        </form>
                      </>
                    ) : (
                      <div className="text-center py-12">
                         <Smartphone size={48} className="mx-auto text-gray-100 mb-4" />
                         <p className="text-gray-400 font-bold text-sm uppercase tracking-widest leading-relaxed">
                           Votre panier est vide.<br/>Sélectionnez un plat pour commencer.
                         </p>
                      </div>
                    )}
                 </div>

                 {/* HELP SECTION */}
                 <div className="bg-blue-50 rounded-[32px] p-8 border border-blue-100">
                    <h4 className="font-black text-blue-900 mb-4 flex items-center gap-2">
                      <Info size={18} /> Comment ça marche ?
                    </h4>
                    <ul className="space-y-4 text-xs font-medium text-blue-700">
                      <li className="flex gap-3">
                        <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">1</span>
                        Composez votre panier et validez les informations de votre commande par le dépôt Wave.
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">2</span>
                        Payez via Wave Mme Loua Honorine (+225 07 05 11 04 09).
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">3</span>
                        Envoyez la capture d'écran sur son WhatsApp pour validation.
                      </li>
                      <li className="flex gap-3">
                        <span className="bg-blue-200 text-blue-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-bold">4</span>
                        Suivez le statut ici et venez chercher votre plat quand il est prêt !
                      </li>
                    </ul>
                    <div className="mt-6 pt-6 border-t border-blue-200 flex flex-col gap-3">
                      <a href={WAVE_PAYMENT_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white text-blue-600 font-black py-3 rounded-2xl shadow-sm border border-blue-200 text-sm">Payer via Wave</a>
                      <a href={MANAGER_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-500 text-white font-black py-3 rounded-2xl shadow-sm text-sm"><MessageCircle size={18}/> Contacter Mme Loua</a>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Canteen;
