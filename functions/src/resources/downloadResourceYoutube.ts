import { AssemblyAI } from 'assemblyai'
// import { Storage } from '@google-cloud/storage'
import * as functions from 'firebase-functions'
import { HttpsError } from 'firebase-functions/v2/https'

type DownloadYoutubeVideoRequest = {
  url: string
  userMetadata: {
    userId: string
    username: string
  }
}

type DownloadYoutubeVideoResponse = {
  success: boolean
  message?: string
  transcription: any
}

// const storage = new Storage()
// const BUCKET_NAME = 'youtube-temp-storage'

export const downloadYoutubeVideoFn = functions.https.onCall<DownloadYoutubeVideoRequest, Promise<DownloadYoutubeVideoResponse>>(
  {
    timeoutSeconds: 300,
  },
  async req => {
    try {
      // Authentication check
      if (!req.auth) {
        throw new HttpsError('permission-denied', 'User not authenticated')
      }

      // const { url, userMetadata } = req.data ?? {}

      // // Validate request data
      // if (!url || !userMetadata || !ytdl.validateURL(url)) {
      //   throw new HttpsError('invalid-argument', 'Invalid URL or missing user data.')
      // }

      // const tempFilePath = path.join(os.tmpdir(), `video-${userMetadata.userId}.mp4`)
      // const blobName = `videos/${userMetadata.userId}-${Date.now()}.mp4`

      // await new Promise((resolve, reject) => {
      //   ytdl(url, {
      //     quality: 'highest',
      //     filter: format => format.container === 'mp4' && format.hasVideo && format.hasAudio,
      //   })
      //     .pipe(fs.createWriteStream(tempFilePath))
      //     .on('finish', resolve)
      //     .on('error', reject)
      // })
      // log(`Downloaded video from ${url}`)

      // const [response] = await storage.bucket(BUCKET_NAME).upload(tempFilePath, { destination: blobName })
      // log(`Uploaded to GCS bucket as ${blobName} || ${response.cloudStorageURI.href}`)

      // fs.unlinkSync(tempFilePath)
      // log(`Deleted temp file ${tempFilePath}`)

      const client = new AssemblyAI({
        apiKey: '561d593411f14bc4b3ba0eaaa4b74d88',
      })

      const fileUrl = 'https://storage.googleapis.com/youtube-temp-storage/test-video.mp3'

      const params = {
        audio: fileUrl,
        speaker_labels: true,
      }

      const transcript = await client.transcripts.transcribe(params)

      if (transcript.status === 'error') {
        console.error(`Transcription failed: ${transcript.error}`)
        process.exit(1)
      }

      console.log(transcript.text)

      const transcription = transcript.text

      // Combine transcripts
      return { success: true, message: 'Download successful!', transcription }
    } catch (error: any) {
      console.error('Error:', error)
      // if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      throw new HttpsError('internal', `Download failed: ${error.message}`)
    }
  }
)

//gs://youtube-temp-storage/videos/123-1736618692913.mp4
