import { AsyncThunk, createAction, createAsyncThunk, createReducer, createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit'
import { AxiosError } from 'axios'
import { Post } from 'types/blog.type'
import { postList } from 'constants/blog'
import http from '@/utils/http'

type GenericAsyncThunk = AsyncThunk<unknown, unknown, any>

type PendingAction = ReturnType<GenericAsyncThunk['pending']>
type RejectedAction = ReturnType<GenericAsyncThunk['rejected']>
type FulfilledAction = ReturnType<GenericAsyncThunk['fulfilled']>

interface BlogState {
  postList: Post[]
  editingPost: Post | null,
  loading: boolean,
  currentRequestId: string
}

const initialState: BlogState = {
  postList: postList,
  editingPost: null,
  loading: false,
  currentRequestId: ''
}

export const getPostsList = createAsyncThunk('blog/getPostsList', async (_, thunkAPI) => {
  const response = await http.get<Post[]>('posts', { signal: thunkAPI.signal })
  return response.data
})

export const addPost = createAsyncThunk('blog/addPost', async (body: Omit<Post, 'id'>, thunkAPI) => {
  const response = await http.post<Post>('posts', body, { signal: thunkAPI.signal })
  return response.data
})

export const editingPost = createAsyncThunk('blog/editingPost', async (postId: string, thunkAPI) => {
  const response = await http.get<Post>('posts/' + postId, { signal: thunkAPI.signal })
  return response.data
})

export const editPost = createAsyncThunk(
  'blog/editPost',
  async ({ postId, body }: { postId: string; body: Post }, thunkAPI) => {
    try {
      const response = await http.put<Post>('posts/' + postId, body, { signal: thunkAPI.signal })
      return response.data
    } catch (error: any) {
      if(error.name === 'AxiosError' && error.response.status === 422) {
        return thunkAPI.rejectWithValue(error.response.data)
      }
      throw error
    }
    
  }
)

export const cancelPost = createAsyncThunk('blog/cancelPost', async (_, thunkAPI) => {
  return true
})

export const deletePost = createAsyncThunk('blog/deletePost', async(postId: string, thunkAPI) => {
  const response = await http.delete<Post>('posts/' + postId, { signal: thunkAPI.signal })
  return response.data
})

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    // addPost: {
    //   reducer(state, action: PayloadAction<Post>) {
    //     state.postList.push(action.payload)
    //   },
    //   prepare(payload: Omit<Post, 'id'>) {
    //     return {
    //       payload: {
    //         ...payload,
    //         id: nanoid()
    //       }
    //     }
    //   }
    // },
    // deletePost: (state, action: PayloadAction<string>) => {
    //   state.postList = state.postList.filter((p) => p.id !== action.payload)
    // },
    // editingPost: (state, action: PayloadAction<string>) => {
    //   state.editingPost = state.postList.find((p) => p.id === action.payload) || null
    // },
    // editPost: (state, action: PayloadAction<Post>) => {
    //   state.postList = state.postList.map((p) => {
    //     if (p.id === action.payload.id) {
    //       return {
    //         ...action.payload
    //       }
    //     }
    //     return p
    //   })
    //   state.editingPost = null
    // },
    // cancelPost: (state) => {
    //   state.editingPost = null
    // }
  },
  extraReducers(builder) {
    builder
      .addCase(getPostsList.fulfilled, (state, action) => {
        state.postList = action.payload
      })
      .addCase(addPost.fulfilled, (state, action) => {
        state.postList.push(action.payload)
      })
      .addCase(editingPost.fulfilled, (state, action) => {
        state.editingPost = action.payload
      })
      .addCase(editPost.fulfilled, (state, action) => {
        state.postList.find((post, index) => {
          if (post.id === action.payload.id) {
            state.postList[index] = action.payload
            return true
          }
          return false
        })
        state.editingPost = null
      })
      .addCase(cancelPost.fulfilled, (state) => {
        state.editingPost = null
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.postList = state.postList.filter((p) => p.id !== action.payload.id)
      })
      .addMatcher<PendingAction>(
        (action) => action.type.endsWith('/pending'),
        (state, action) => {
          state.loading = true
          state.currentRequestId = action.meta.requestId
        }
      )
      .addMatcher<RejectedAction | FulfilledAction>(
        (action) => action.type.endsWith('/rejected') || action.type.endsWith('/fulfilled'),
        (state, action) => {
          if(state.loading && state.currentRequestId === action.meta.requestId) {
            state.loading = false
            state.currentRequestId = ''
          }
        }
      )
  }
})

// export const {
//   addPost,
//   cancelPost,
//   deletePost
//   editPost,
//   editingPost
// } = blogSlice.actions
export default blogSlice.reducer

// export const addPost = createAction('blog/addPost', (payload: Omit<Post, 'id'>) => {
//   return {
//     payload:{
//       ...payload,
//       id: nanoid()
//     }
//   }
// })
// export const deletePost = createAction<string>('blog/deletePost')
// export const editingPost = createAction<string>('blog/editingPost')
// export const editPost = createAction<Post>('blog/editPost')
// export const cancelPost = createAction('blog/cancelPost')

// const blogReducer = createReducer(initialState, (builder) => {
//   builder
//     .addCase(addPost, (state, action) => {
//       state.postList.push(action.payload)
//     })
//     .addCase(deletePost, (state, action) => {
//       state.postList = state.postList.filter(p => p.id !== action.payload)
//     })
//     .addCase(editingPost, (state, action) => {
//       state.editingPost = state.postList.find(p => p.id === action.payload) || null
//     })
//     .addCase(editPost, (state, action) => {
//       state.postList = state.postList.map(p => {
//         if(p.id === action.payload.id) {
//           return {
//             ...action.payload
//           }
//         }
//         return p
//       })
//       state.editingPost = null
//     })
//     .addCase(cancelPost, (state) => {
//       state.editingPost = null
//     })
// })

// export default blogReducer
