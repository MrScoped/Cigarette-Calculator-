import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  ScrollView, StyleSheet, Alert, 
  Modal, FlatList, Share, Switch,
  Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

export default function PremiumCigaretteCalculator() {
  // বাংলাদেশ সিগারেট দাম
  const brands = [
    { name: 'Hollywood', price: 144, icon: 'local-fire-department' },
    { name: 'Derby', price: 144, icon: 'diamond' },
    { name: 'Royal', price: 126, icon: 'crown' },
    { name: 'Black Diamond', price: 105, icon: 'flag' },
    { name: 'Camel', price: 180, icon: 'flag' },
    { name: 'Star', price: 172, icon: 'star' },
    { name: 'Lucky Strike', price: 210, icon: 'casino' },
    { name: 'Benson', price: 370, icon: 'flag' },
    { name: 'Marlboro', price: 370, icon: 'flag' },
    { name: 'Gold Leaf', price: 280, icon: 'eco' },
  ];

  // State variables
  const [quantities, setQuantities] = useState({});
  const [totals, setTotals] = useState({});
  const [grandTotal, setGrandTotal] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [shopName] = useState('প্রিমিয়াম সিগারেট শপ');
  const [tapCount, setTapCount] = useState(0);
  const [activeTab, setActiveTab] = useState('calculator');

  // থিম কালার
  const theme = {
    light: {
      bg: '#f8fafc',
      card: '#ffffff',
      text: '#1e293b',
      primary: '#2563eb',
      secondary: '#059669',
      accent: '#dc2626',
      border: '#e2e8f0',
      surface: '#f1f5f9'
    },
    dark: {
      bg: '#0f172a',
      card: '#1e293b',
      text: '#f1f5f9',
      primary: '#3b82f6',
      secondary: '#10b981',
      accent: '#ef4444',
      border: '#334155',
      surface: '#1e293b'
    }
  };

  const colors = isDarkMode ? theme.dark : theme.light;

  // ইতিহাস লোড
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('cigarette_history');
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (error) {
      console.error('ইতিহাস লোডে সমস্যা:', error);
    }
  };

  const saveToHistory = async () => {
    const timestamp = new Date().toLocaleString('bn-BD', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const transaction = {
      id: Date.now().toString(),
      date: timestamp,
      items: brands.filter(b => parseInt(quantities[b.name] || 0) > 0)
        .map(brand => ({
          name: brand.name,
          quantity: parseInt(quantities[brand.name]),
          price: brand.price,
          total: parseInt(quantities[brand.name]) * brand.price
        })),
      total: grandTotal
    };

    const newHistory = [transaction, ...history.slice(0, 49)];
    setHistory(newHistory);
    
    try {
      await AsyncStorage.setItem('cigarette_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('ইতিহাস সংরক্ষণে সমস্যা:', error);
    }
  };

  const calculateTotal = () => {
    let newTotals = {};
    let total = 0;

    brands.forEach(brand => {
      const qty = parseInt(quantities[brand.name] || 0);
      const brandTotal = qty * brand.price;
      newTotals[brand.name] = brandTotal;
      total += brandTotal;
    });

    setTotals(newTotals);
    setGrandTotal(total);
    
    if (total > 0) {
      saveToHistory();
      Alert.alert(
        '✅ হিসাব সম্পূর্ণ',
        `মোট টাকা: ৳${total.toLocaleString('bn-BD')}\n` +
        'ইতিহাসে সংরক্ষণ করা হয়েছে।',
        [{ text: 'ঠিক আছে' }]
      );
    }
  };

  const generateReceipt = () => {
    const items = brands.filter(b => parseInt(quantities[b.name] || 0) > 0);
    
    if (items.length === 0) {
      Alert.alert('⚠️ সতর্কতা', 'দয়া করে প্রথমে কিছু আইটেম যোগ করুন।');
      return;
    }

    let receipt = `╔══════════════════════════════╗\n`;
    receipt += `║    🏪 ${shopName}    ║\n`;
    receipt += `╠══════════════════════════════╣\n`;
    receipt += `║ তারিখ: ${new Date().toLocaleDateString('bn-BD', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })} ║\n`;
    receipt += `║ সময়: ${new Date().toLocaleTimeString('bn-BD', {
      hour: '2-digit',
      minute: '2-digit'
    })}                   ║\n`;
    receipt += `╠══════════════════════════════╣\n`;
    receipt += `║        📋 বিক্রয় রসিদ         ║\n`;
    receipt += `╠══════════════════════════════╣\n`;
    
    items.forEach(brand => {
      const qty = parseInt(quantities[brand.name]);
      const itemTotal = qty * brand.price;
      receipt += `║ ${brand.name.padEnd(12)} ${qty.toString().padStart(3)} × ৳${brand.price.toString().padStart(4)} ║\n`;
      receipt += `║ ${' '.repeat(17)} ৳${itemTotal.toString().padStart(6)} ║\n`;
    });
    
    receipt += `╠══════════════════════════════╣\n`;
    receipt += `║ মোট টাকা: ${' '.repeat(9)} ৳${grandTotal.toString().padStart(8)} ║\n`;
    receipt += `║ বাংলা: ${numberToBanglaWords(grandTotal).padEnd(20)} ║\n`;
    receipt += `╚══════════════════════════════╝\n`;
    receipt += `        🙏 ধন্যবাদ\n`;
    receipt += `      আবার আসবেন!`;

    Alert.alert('🧾 রসিদ তৈরি হয়েছে', receipt, [
      { text: '📤 শেয়ার করুন', onPress: () => shareReceipt(receipt) },
      { text: '💾 সেভ করুন', onPress: () => saveReceipt(receipt) },
      { text: 'ঠিক আছে' }
    ]);
  };

  const numberToBanglaWords = (num) => {
    const banglaNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    let banglaNum = num.toString().split('').map(digit => banglaNumbers[digit] || digit).join('');
    return banglaNum + ' টাকা';
  };

  const shareReceipt = async (receipt) => {
    try {
      await Share.share({
        message: `📱 ${shopName}\n${receipt}\n\n📞 যোগাযোগ: ০১৫৯০০০৪৬৮৫`,
        title: 'সিগারেট বিল'
      });
    } catch (error) {
      Alert.alert('ত্রুটি', 'শেয়ার করতে সমস্যা হয়েছে।');
    }
  };

  const saveReceipt = (receipt) => {
    Alert.alert('সফল', 'রসিদ সেভ করা হয়েছে।');
  };

  const clearAll = () => {
    Alert.alert(
      'সাফ করুন',
      'সব তথ্য সাফ করতে চান?',
      [
        { text: 'বাতিল', style: 'cancel' },
        { 
          text: 'সাফ করুন', 
          style: 'destructive',
          onPress: () => {
            setQuantities({});
            setTotals({});
            setGrandTotal(0);
          }
        }
      ]
    );
  };

  const clearHistory = async () => {
    Alert.alert(
      'ইতিহাস সাফ করুন',
      'সমস্ত ইতিহাস মুছে ফেলতে চান?',
      [
        { text: 'বাতিল', style: 'cancel' },
        { 
          text: 'সাফ করুন', 
          style: 'destructive',
          onPress: async () => {
            setHistory([]);
            await AsyncStorage.removeItem('cigarette_history');
            Alert.alert('সফল', 'ইতিহাস সাফ করা হয়েছে।');
          }
        }
      ]
    );
  };

  const checkForCopyAttempt = () => {
    setTapCount(prev => {
      const newCount = prev + 1;
      if (newCount === 7) {
        Alert.alert(
          '👨‍💻 ডেভেলপার তথ্য',
          `ডেভেলপার: রাহিম\n` +
          `যোগাযোগ: ০১৫৯০০০৪৬৮৫\n` +
          `ভার্সন: ৩.০.০\n` +
          `© ${new Date().getFullYear()} - সকল অধিকার সংরক্ষিত\n\n` +
          `⚠️ কপিরাইট আইন অনুসারে অপরাধীকে সর্বোচ্চ ৫ বছর কারাদণ্ড হতে পারে।`,
          [{text: 'বুঝেছি'}]
        );
        return 0;
      }
      return newCount;
    });
  };

  const showCopyrightAlert = () => {
    Alert.alert(
      '© কপিরাইট সতর্কতা',
      'এই অ্যাপ্লিকেশনটি তৈরিকারী:\n' +
      '🔹 রাহিম\n' +
      '📞 ০১৫৯০০০৪৬৮৫ (হোয়াটসঅ্যাপ)\n\n' +
      '⚖️ কপিরাইট আইন ২০০০:\n' +
      '• অনুমতি ছাড়া কপি করা নিষিদ্ধ\n' +
      '• বাণিজ্যিক ব্যবহারের জন্য লাইসেন্স প্রয়োজন\n' +
      '• আইন ভঙ্গ করলে ৫ বছর পর্যন্ত কারাদণ্ড\n\n' +
      '✅ লাইসেন্সের জন্য যোগাযোগ করুন।',
      [{text: 'সম্পূর্ণ বুঝেছি'}]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      backgroundColor: colors.primary,
      paddingTop: 50,
      paddingBottom: 20,
      paddingHorizontal: 20,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: 'white',
      letterSpacing: 0.5,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
      marginTop: 5,
    },
    themeToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
    },
    themeText: {
      color: 'white',
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '500',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      marginTop: -15,
      borderRadius: 15,
      padding: 5,
      elevation: 3,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 12,
    },
    activeTab: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    activeTabText: {
      color: 'white',
    },
    contentContainer: {
      padding: 20,
    },
    priceCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      marginBottom: 20,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    priceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    priceItem: {
      width: '48%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    brandInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    brandName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    price: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    inputSection: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    inputRow: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 10,
      padding: 15,
      alignItems: 'center',
      elevation: 2,
    },
    inputLabel: {
      flex: 2,
      fontSize: 15,
      color: colors.text,
      fontWeight: '600',
    },
    inputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
    },
    input: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      backgroundColor: colors.bg,
      color: colors.text,
      textAlign: 'center',
    },
    totalBox: {
      flex: 1,
      backgroundColor: colors.secondary + '15',
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 11,
      color: colors.secondary,
      marginBottom: 2,
    },
    totalValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.secondary,
    },
    buttonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    actionButton: {
      width: '48%',
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      elevation: 3,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    buttonIcon: {
      marginRight: 8,
    },
    buttonLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    totalCard: {
      backgroundColor: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`,
      borderRadius: 20,
      padding: 25,
      alignItems: 'center',
      marginBottom: 20,
    },
    totalTitle: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '600',
      marginBottom: 5,
    },
    totalAmount: {
      fontSize: 48,
      fontWeight: 'bold',
      color: 'white',
      marginVertical: 10,
    },
    banglaTotal: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.9)',
      textAlign: 'center',
    },
    footer: {
      padding: 20,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    footerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    copyright: {
      fontSize: 12,
      color: colors.text + '80',
    },
    contactButton: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
    },
    contactText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    warning: {
      fontSize: 10,
      color: colors.accent,
      textAlign: 'center',
      marginTop: 10,
      fontStyle: 'italic',
    },
    // History Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.card,
      width: width * 0.9,
      maxHeight: '80%',
      borderRadius: 25,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    historyItem: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyDate: {
      fontSize: 13,
      color: colors.text + '80',
      marginBottom: 5,
    },
    historyAmount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
    },
    historyItems: {
      fontSize: 12,
      color: colors.text + '60',
      marginTop: 3,
    },
    emptyHistory: {
      padding: 40,
      alignItems: 'center',
    },
    emptyHistoryText: {
      fontSize: 16,
      color: colors.text + '40',
      textAlign: 'center',
    },
  });

  const HistoryModal = () => (
    <Modal
      visible={showHistory}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowHistory(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📜 বিক্রয় ইতিহাস</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          {history.length > 0 ? (
            <>
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity 
                    style={styles.historyItem}
                    onPress={() => {
                      Alert.alert(
                        'বিস্তারিত বিক্রয়',
                        item.items.map(i => 
                          `${i.name}: ${i.quantity} × ৳${i.price} = ৳${i.total}`
                        ).join('\n') +
                        `\n\n💰 মোট: ৳${item.total.toLocaleString('bn-BD')}`,
                        [{text: 'ঠিক আছে'}]
                      );
                    }}
                  >
                    <Text style={styles.historyDate}>{item.date}</Text>
                    <Text style={styles.historyAmount}>৳ {item.total.toLocaleString('bn-BD')}</Text>
                    <Text style={styles.historyItems}>
                      {item.items.length}টি পণ্য • {item.items.reduce((sum, i) => sum + i.quantity, 0)} প্যাক
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity 
                style={[styles.actionButton, {margin: 16, backgroundColor: colors.accent + '20'}]}
                onPress={clearHistory}
              >
                <Icon name="delete" size={20} color={colors.accent} style={styles.buttonIcon} />
                <Text style={[styles.buttonLabel, {color: colors.accent}]}>ইতিহাস সাফ করুন</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyHistory}>
              <Icon name="history" size={60} color={colors.text + '30'} />
              <Text style={styles.emptyHistoryText}>কোনো ইতিহাস নেই</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  const CalculatorTab = () => (
    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Price List */}
      <TouchableOpacity 
        style={styles.priceCard}
        onLongPress={showCopyrightAlert}
        activeOpacity={0.9}
      >
        <Text style={styles.cardTitle}>
          <Icon name="attach-money" size={20} color={colors.text} />
          <Text>  বর্তমান দাম (প্রতি প্যাক)</Text>
        </Text>
        <View style={styles.priceGrid}>
          {brands.map((brand) => (
            <View key={brand.name} style={styles.priceItem}>
              <View style={styles.brandInfo}>
                <Icon name={brand.icon} size={18} color={colors.primary} />
                <Text style={styles.brandName}>{brand.name}</Text>
              </View>
              <Text style={styles.price}>৳{brand.price}</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>

      {/* Input Section */}
      <View style={styles.inputSection}>
        <Text style={styles.sectionTitle}>
          <Icon name="edit" size={18} color={colors.text} />
          <Text>  প্যাক সংখ্যা লিখুন</Text>
        </Text>
        
        {brands.map(brand => (
          <View key={brand.name} style={styles.inputRow}>
            <Text style={styles.inputLabel}>
              <Icon name={brand.icon} size={16} color={colors.primary} />
              <Text>  {brand.name}</Text>
            </Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colors.text + '60'}
                keyboardType="number-pad"
                value={quantities[brand.name] || ''}
                onChangeText={(text) => setQuantities({
                  ...quantities,
                  [brand.name]: text.replace(/[^0-9]/g, '')
                })}
              />
            </View>
            
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>মোট</Text>
              <Text style={styles.totalValue}>৳{totals[brand.name] || 0}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonGrid}>
        <TouchableOpacity 
          style={[styles.actionButton, {backgroundColor: colors.primary}]}
          onPress={calculateTotal}
        >
          <Icon name="calculate" size={20} color="white" style={styles.buttonIcon} />
          <Text style={[styles.buttonLabel, {color: 'white'}]}>হিসাব করুন</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, {backgroundColor: colors.secondary}]}
          onPress={generateReceipt}
        >
          <Icon name="receipt" size={20} color="white" style={styles.buttonIcon} />
          <Text style={[styles.buttonLabel, {color: 'white'}]}>রসিদ তৈরি</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowHistory(true)}
        >
          <Icon name="history" size={20} color={colors.primary} style={styles.buttonIcon} />
          <Text style={styles.buttonLabel}>ইতিহাস</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={clearAll}
        >
          <Icon name="delete-sweep" size={20} color={colors.accent} style={styles.buttonIcon} />
          <Text style={[styles.buttonLabel, {color: colors.accent}]}>সাফ করুন</Text>
        </TouchableOpacity>
      </View>

      {/* Grand Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalTitle}>মোট বিক্রয় মূল্য</Text>
        <Text style={styles.totalAmount}>৳{grandTotal.toLocaleString('bn-BD')}</Text>
        <Text style={styles.banglaTotal}>
          {grandTotal > 0 ? numberToBanglaWords(grandTotal) : 'শূন্য টাকা'}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={checkForCopyAttempt} activeOpacity={0.8}>
            <Text style={styles.headerTitle}>{shopName}</Text>
            <Text style={styles.headerSubtitle}>
              ডেভেলপার: রাহিম • ভার্সন ৩.০.০
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.themeToggle}
            onPress={() => setIsDarkMode(!isDarkMode)}
          >
            <Icon 
              name={isDarkMode ? 'dark-mode' : 'light-mode'} 
              size={18} 
              color="white" 
            />
            <Text style={styles.themeText}>
              {isDarkMode ? 'ডার্ক' : 'লাইট'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'calculator' && styles.activeTab]}
          onPress={() => setActiveTab('calculator')}
        >
          <Text style={[styles.tabText, activeTab === 'calculator' && styles.activeTabText]}>
            🧮 ক্যালকুলেটর
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
            ℹ️ তথ্য
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'calculator' ? <CalculatorTab /> : (
        <ScrollView style={styles.contentContainer}>
          <View style={styles.priceCard}>
            <Text style={styles.cardTitle}>📱 অ্যাপ সম্পর্কে</Text>
            <Text style={{color: colors.text, lineHeight: 22, marginBottom: 15}}>
              এই অ্যাপটি বাংলাদেশের সিগারেট বিক্রেতাদের জন্য তৈরি করা হয়েছে। 
              দ্রুত ও নির্ভুলভাবে সিগারেটের দাম হিসাব করতে পারেন।
            </Text>
            
            <Text style={[styles.cardTitle, {marginTop: 20}]}>📞 যোগাযোগ</Text>
            <TouchableOpacity 
              style={[styles.inputRow, {backgroundColor: colors.primary + '10'}]}
              onPress={() => Alert.alert('হোয়াটসঅ্যাপ', '০১৫৯০০০৪৬৮৫ নম্বরে যোগাযোগ করুন।')}
            >
              <Icon name="whatsapp" size={24} color="#25D366" />
              <Text style={[styles.inputLabel, {marginLeft: 10, color: colors.primary}]}>
                ০১৫৯০০০৪৬৮৫
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Text style={styles.copyright}>
            © {new Date().getFullYear()} রাহিম - সকল অধিকার সংরক্ষিত
          </Text>
          <TouchableOpacity 
            style={styles.contactButton}
            onPress={showCopyrightAlert}
          >
            <Text style={styles.contactText}>⚖️ কপিরাইট</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.warning}>
          ⚠️ এই সফটওয়্যারের মেধাস্বত্ব আইন দ্বারা সুরক্ষিত। 
          অনুমতি ছাড়া ব্যবহার আইনত দণ্ডনীয় অপরাধ।
        </Text>
      </View>

      {/* History Modal */}
      <HistoryModal />
    </View>
  );
}

// ============================================
// কপিরাইট © ২০২৪ রাহিম
// এই অ্যাপ্লিকেশনের সম্পূর্ণ মেধাস্বত্ব রাহিমের।
// কোন অংশই পুনরুৎপাদন বা বিতরণ করা যাবে না।
// লাইসেন্সের জন্য: ০১৫৯০০০৪৬৮৫ (হোয়াটসঅ্যাপ)
// ============================================
