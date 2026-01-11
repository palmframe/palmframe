'use server'

import { getProviderDisplayName, getProviderName } from '@/lib/sandbox-provider'

export async function getProvider() {
  return {
    name: getProviderName(),
    displayName: getProviderDisplayName(),
  }
}
