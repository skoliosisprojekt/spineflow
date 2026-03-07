import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00B894',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E5E5EA',
          borderTopWidth: 0.5,
          height: 85,
          paddingTop: 8,
          paddingBottom: 28,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.home'),
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: t('tabs.exercises'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="fitness-center" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.exercises'),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: t('tabs.workout'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="play-circle-outline" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.workout'),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t('tabs.progress'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bar-chart" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.progress'),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t('tabs.nutrition'),
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="restaurant" size={size} color={color} />
          ),
          tabBarAccessibilityLabel: t('tabs.nutrition'),
        }}
      />
    </Tabs>
  );
}
