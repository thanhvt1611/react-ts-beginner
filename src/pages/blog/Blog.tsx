import React from 'react'
import CreatePost from 'components/CreatePost'
import PostList from 'components/PostList'

function Blog() {
  return (
    <div className='p-5'>
      <CreatePost />
      <PostList />
    </div>
  )
}

export default Blog
