import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CreateTabScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-[#0F0F0F] pt-[60px]">
            <View className="flex-1 items-center justify-center px-10">
                <MaterialIcons name="add-circle-outline" size={64} color="#9333EA" />
                <Text className="text-3xl font-bold text-white mb-3 text-center">Create Event</Text>
                <Text className="text-base text-[#9CA3AF] text-center mb-8">
                    Start creating amazing events and reach your audience
                </Text>
                <TouchableOpacity
                    className="bg-[#9333EA] py-4 px-8 rounded-xl"
                    onPress={() => router.push('/create-event')}
                >
                    <Text className="text-white text-base font-semibold">Get Started</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

