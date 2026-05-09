import axios from 'axios'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

export class ValidationService {
  async validateWebChallenge(url, expectedOutput) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: null // Don't throw on HTTP errors
      })

      // Check if expected output exists in response
      const isValid = response.data.includes(expectedOutput)
      
      return {
        isValid,
        statusCode: response.status,
        responseTime: response.headers['response-time'],
        data: isValid ? 'Output found' : 'Output not found'
      }
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      }
    }
  }

  async validateBinaryChallenge(binaryPath, testInputs) {
    try {
      const results = []
      
      for (const test of testInputs) {
        const { stdout, stderr } = await execAsync(
          `"${binaryPath}" ${test.input}`,
          { timeout: 5000 }
        )

        const isValid = stdout.includes(test.expectedOutput)
        results.push({
          input: test.input,
          expected: test.expectedOutput,
          actual: stdout,
          isValid,
          error: stderr || null
        })
      }

      return {
        overall: results.every(r => r.isValid),
        results
      }
    } catch (error) {
      return {
        overall: false,
        error: error.message
      }
    }
  }

  async validateCryptoChallenge(encryptedFile, decryptionKey, expectedPattern) {
    try {
      // This is a simplified example - real implementation would depend on challenge
      const encryptedData = await fs.readFile(encryptedFile, 'utf8')
      
      // Simple XOR decryption example
      let decrypted = ''
      for (let i = 0; i < encryptedData.length; i++) {
        decrypted += String.fromCharCode(
          encryptedData.charCodeAt(i) ^ decryptionKey.charCodeAt(i % decryptionKey.length)
        )
      }

      const isValid = decrypted.includes(expectedPattern)
      
      return {
        isValid,
        decrypted: isValid ? decrypted : 'Decryption failed',
        length: decrypted.length
      }
    } catch (error) {
      return {
        isValid: false,
        error: error.message
      }
    }
  }

  async validateFlagFormat(flag, challenge) {
    const flagRegex = challenge.flagFormat || /^CTF\{.+\}$/
    
    if (!flagRegex.test(flag)) {
      return {
        isValid: false,
        error: 'Flag format is incorrect'
      }
    }

    return { isValid: true }
  }

  async runHealthCheck(challenge) {
    const healthChecks = {
      web: async () => this.validateWebChallenge(challenge.url, challenge.healthCheck),
      binary: async () => this.validateBinaryChallenge(challenge.binaryPath, challenge.testCases),
      crypto: async () => this.validateCryptoChallenge(challenge.encryptedFile, challenge.key, challenge.expected)
    }

    const check = healthChecks[challenge.type]
    if (check) {
      return await check()
    }

    return { isValid: true, message: 'No health check configured' }
  }
}

export default new ValidationService()