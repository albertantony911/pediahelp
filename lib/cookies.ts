'use client'

import Cookies from 'js-cookie'

const USER_INFO_KEY = 'pedia_user';

export function saveUserInfo(data: {
  parentName: string
  patientName: string
  email: string
  phone: string
}) {
  Cookies.set(USER_INFO_KEY, JSON.stringify(data), { expires: 7 }); // expires in 7 days
}

export function getUserInfo() {
  const value = Cookies.get(USER_INFO_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function clearUserInfo() {
  Cookies.remove(USER_INFO_KEY);
}