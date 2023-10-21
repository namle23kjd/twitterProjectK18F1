import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb'
import { config } from 'dotenv'
import User from '~/models/schemas/User.schema'
config()

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@tweetproject.tqff1zq.mongodb.net/?retryWrites=true&w=majority`

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
class DatabaseService {
  private client: MongoClient
  private db: Db
  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(process.env.DB_NAME)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
    } catch (error) {
      console.log(error)
      throw error
    }
  }
  // get user() : nếu chúng ta ko mô tả nó ra thì nó chỉ là 1 document thôi , nó sẽ ko có các method của collection để xổ ra
  //Nên chúng ta định nghĩa Collection<User> để cho nó hiểu lun
  get user(): Collection<User> {
    //Định nghĩa user là của thằng nào lun để mình chấm là nó ra
    return this.db.collection(process.env.DB_USERS_COLLECTION as string)
  }
}

const databaseService = new DatabaseService()
export default databaseService
// import { MongoClient, ServerApiVersion } from 'mongodb'
