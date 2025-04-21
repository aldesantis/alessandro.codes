import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["grid", "item", "checkbox", "allCheckbox"]
  static values = {
    filters: { type: Object, default: { status: ["all"], topics: ["all"], types: ["all"] } }
  }

  connect() {
    this.updateVisibility()
  }

  filter(event) {
    const checkbox = event.currentTarget
    const { filterType, filterCategory } = checkbox.dataset
    const isChecked = checkbox.checked

    if (filterType === 'all') {
      this.handleAllFilter(filterCategory, isChecked, checkbox)
    } else {
      this.handleSpecificFilter(filterCategory, filterType, isChecked)
    }

    this.updateVisibility()
  }

  handleAllFilter(category, isChecked, checkbox) {
    if (isChecked) {
      this.filtersValue[category] = ['all']
      this.uncheckOtherCheckboxes(checkbox)
    } else {
      checkbox.checked = true // Prevent unchecking "All" if it's the only one
    }
  }

  handleSpecificFilter(category, filterType, isChecked) {
    const currentFilters = this.filtersValue[category]
    const allCheckbox = this.allCheckboxTargets.find(cb => cb.dataset.filterCategory === category)

    if (isChecked) {
      // Remove 'all' and add the new filter
      const newFilters = currentFilters.filter(f => f !== 'all')
      this.filtersValue[category] = [...newFilters, filterType]
      allCheckbox.checked = false
    } else {
      // Remove the filter
      const newFilters = currentFilters.filter(f => f !== filterType)
      this.filtersValue[category] = newFilters.length ? newFilters : ['all']
      if (newFilters.length === 0) allCheckbox.checked = true
    }
  }

  uncheckOtherCheckboxes(checkbox) {
    const { filterCategory } = checkbox.dataset
    this.checkboxTargets
      .filter(cb => cb.dataset.filterCategory === filterCategory && cb.dataset.filterType !== 'all')
      .forEach(cb => cb.checked = false)
  }

  updateVisibility() {
    this.itemTargets.forEach(item => {
      const status = item.dataset.status
      const topics = item.dataset.topics ? item.dataset.topics.split(',').filter(Boolean) : []
      const type = item.dataset.type
      
      const isVisible = this.isItemVisible(status, topics, type)
      item.classList.toggle('hidden', !isVisible)
    })
  }

  isItemVisible(status, topics, type) {
    const { status: statusFilters, topics: topicFilters, types: typeFilters } = this.filtersValue
    
    const statusMatch = statusFilters.includes('all') || statusFilters.includes(status)
    const topicsMatch = topicFilters.includes('all') || 
                       (topics.length > 0 && topics.some(topic => topicFilters.includes(topic)))
    const typeMatch = typeFilters.includes('all') || typeFilters.includes(type)
    
    return statusMatch && topicsMatch && typeMatch
  }
} 
