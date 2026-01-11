'use server'

import { Duration, ms } from '@/lib/duration'
import { SandboxProviderFactory, getProviderName } from '@/lib/sandbox-provider'
import { customAlphabet } from 'nanoid'
import { db } from '@/lib/db'
import { shortUrls } from '@/lib/db/schema'

const nanoid = customAlphabet('1234567890abcdef', 7)

export async function publish(
  url: string,
  sbxId: string,
  duration: Duration,
  teamID: string | undefined,
  accessToken: string | undefined,
) {
  const provider = getProviderName()
  const parsedUrl = new URL(url)

  // Validate URL based on provider
  if (provider === 'e2b') {
    if (!parsedUrl.hostname.endsWith('.e2b.app')) {
      throw new Error('URL must be on *.e2b.app domain')
    }
  } else if (provider === 'daytona') {
    if (!parsedUrl.hostname.endsWith('.daytona.app')) {
      throw new Error('URL must be on *.daytona.app domain')
    }
  } else if (provider === 'docker') {
    // Docker allows localhost or custom DOCKER_HOST
    const allowedHosts = ['localhost', '127.0.0.1', '0.0.0.0']
    const dockerHost = process.env.DOCKER_HOST?.replace(/^tcp:\/\//, '').split(':')[0]
    if (dockerHost) {
      allowedHosts.push(dockerHost)
    }

    if (!allowedHosts.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.includes(host))) {
      throw new Error(`URL must be on allowed Docker hosts: ${allowedHosts.join(', ')}`)
    }
  }

  const expiration = ms(duration)
  if (expiration > ms('24h')) {
    throw new Error('Expiration must be 24 hours or less')
  }

  // Set timeout using provider-specific logic
  await SandboxProviderFactory.setTimeout(sbxId, expiration, {
    ...(teamID && accessToken
      ? {
          headers: {
            'X-Supabase-Team': teamID,
            'X-Supabase-Token': accessToken,
          },
        }
      : {}),
  })

  const id = nanoid()
  await db.insert(shortUrls).values({
    id,
    url,
    createdAt: new Date(),
  })

  return {
    url: process.env.NEXT_PUBLIC_SITE_URL
      ? `https://${process.env.NEXT_PUBLIC_SITE_URL}/s/${id}`
      : `/s/${id}`,
  }
}
