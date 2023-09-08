export const getBookmarks = () => {
	const bookmarks = localStorage.getItem("bookmarks")
	if (bookmarks) {
		return JSON.parse(bookmarks)
	}
	return null
}

export const storeBookmarks = (bookmarks: BookmarkGroups) => {
	localStorage.setItem("bookmarks", JSON.stringify(bookmarks))
}